#!/usr/bin/env python3
"""Build game/js/mapdata.js: real coastlines for the in-game world maps.

Source: Natural Earth (public domain) via the world-atlas TopoJSON package
(https://github.com/topojson/world-atlas). The script downloads the files
once into a cache folder, clips the land to each era's map, projects it,
simplifies it for a phone-sized map and writes compact SVG paths.

  python3 tools/build_maps.py [cache_dir]

Maps (js/maps.js draws provinces on top of these):
  rome      the Roman world            equirectangular around 40N
  medieval  Western Europe             equirectangular around 47N
  viking    the North Atlantic to Rus  equirectangular around 60N, with a Greenland inset
  world     the modern world           equirectangular, all countries, game countries highlighted
"""
import json, math, os, sys, urllib.request

CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '.geo-cache')
OUT = os.path.join(os.path.dirname(__file__), '..', 'game', 'js', 'mapdata.js')
BASE = 'https://cdn.jsdelivr.net/npm/world-atlas@2/'


def load(name):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        urllib.request.urlretrieve(BASE + name, path)
    with open(path) as f:
        return json.load(f)


def decode(topo):
    sc, tr = topo['transform']['scale'], topo['transform']['translate']
    arcs = []
    for arc in topo['arcs']:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sc[0] + tr[0], y * sc[1] + tr[1]))
        arcs.append(pts)
    return arcs


def ring(arcs, idxs):
    pts = []
    for i in idxs:
        a = arcs[i] if i >= 0 else arcs[~i][::-1]
        pts.extend(a[1:] if pts else a)
    return unwrap(pts)


def unwrap(pts):
    """world-atlas does not cut rings at the antimeridian (Chukotka, Fiji): make
    longitudes continuous so a ring never jumps from +180 to -180 across the map."""
    out, shift = [], 0
    for i, (x, y) in enumerate(pts):
        if i and abs(x + shift - out[-1][0]) > 180:
            shift += -360 if x + shift > out[-1][0] else 360
        out.append((x + shift, y))
    # Keep the bulk of the ring where it belongs (a ring may start in Chukotka).
    med = sorted(p[0] for p in out)[len(out) // 2]
    k = round(med / 360)
    return [(x - 360 * k, y) for x, y in out] if k else out


def polygons(arcs, geom):
    t = geom['type']
    if t == 'Polygon':
        return [[ring(arcs, r) for r in geom['arcs']]]
    if t == 'MultiPolygon':
        return [[ring(arcs, r) for r in p] for p in geom['arcs']]
    if t == 'GeometryCollection':
        out = []
        for g in geom['geometries']:
            out.extend(polygons(arcs, g))
        return out
    return []


def clip(pts, x0, y0, x1, y1):
    """Sutherland-Hodgman: clip a closed ring to a rectangle (lon/lat)."""
    def edge(pts, inside, cut):
        out = []
        if not pts:
            return out
        prev = pts[-1]
        for cur in pts:
            if inside(cur):
                if not inside(prev):
                    out.append(cut(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(cut(prev, cur))
            prev = cur
        return out

    def at_x(x):
        return lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))

    def at_y(y):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y)

    pts = edge(pts, lambda p: p[0] >= x0, at_x(x0))
    pts = edge(pts, lambda p: p[0] <= x1, at_x(x1))
    pts = edge(pts, lambda p: p[1] >= y0, at_y(y0))
    pts = edge(pts, lambda p: p[1] <= y1, at_y(y1))
    return pts


def simplify(pts, tol):
    """Douglas-Peucker on an open polyline."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy) or 1e-9
        best, bi = 0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / L if (dx or dy) else math.hypot(px - ax, py - ay)
            if d > best:
                best, bi = d, i
        if best > tol and bi > 0:
            keep[bi] = True
            stack.append((a, bi))
            stack.append((bi, b))
    return [p for p, k in zip(pts, keep) if k]


def area(pts):
    return abs(sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))) / 2


def num(v):
    s = ('%.1f' % v).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def path(rings):
    """Compact SVG path: absolute move, then relative line deltas of rounded points."""
    out = []
    for r in rings:
        q = [(round(x, 1), round(y, 1)) for x, y in r]
        d = ['M' + num(q[0][0]) + ' ' + num(q[0][1]) + 'l']
        parts = []
        for (ax, ay), (bx, by) in zip(q, q[1:]):
            dx, dy = round(bx - ax, 1), round(by - ay, 1)
            if dx == 0 and dy == 0:
                continue
            parts.append(num(dx) + ' ' + num(dy))
        out.append(d[0] + ' '.join(parts).replace(' -', '-') + 'z')
    return ''.join(out)


class Proj:
    """Equirectangular projection scaled to a given width."""
    def __init__(self, lon0, lat0, lon1, lat1, w, ky_scale=None):
        self.lon0, self.lat0, self.lon1, self.lat1, self.w = lon0, lat0, lon1, lat1, w
        self.kx = w / (lon1 - lon0)
        self.ky = self.kx * (ky_scale if ky_scale else 1 / math.cos(math.radians((lat0 + lat1) / 2)))
        self.h = round((lat1 - lat0) * self.ky)

    def __call__(self, p):
        return ((p[0] - self.lon0) * self.kx, (self.lat1 - p[1]) * self.ky)

    def meta(self):
        return {'w': self.w, 'h': self.h, 'lon0': self.lon0, 'lat1': self.lat1, 'kx': round(self.kx, 5), 'ky': round(self.ky, 5)}


def land_path(polys, pr, tol=0.35, min_area=0.6, margin=1.5):
    rings = []
    for poly in polys:
        for r in poly:
            c = clip(r, pr.lon0 - margin, pr.lat0 - margin, pr.lon1 + margin, pr.lat1 + margin)
            if len(c) < 3:
                continue
            xy = [pr(p) for p in c]
            s = simplify(xy + [xy[0]], tol)[:-1]
            if len(s) >= 3 and area(s) >= min_area:
                rings.append(s)
    return path(rings), sum(len(r) for r in rings)


def main():
    land50 = load('land-50m.json')
    countries = load('countries-110m.json')
    a50 = decode(land50)
    polys50 = polygons(a50, land50['objects']['land'])
    data = {}
    maps = {
        'rome': Proj(-12, 22, 54, 59, 360),
        'medieval': Proj(-11, 36, 17, 59, 360),
        'viking': Proj(-26, 47.5, 42, 71.5, 360),
    }
    for k, pr in maps.items():
        d, n = land_path(polys50, pr)
        m = pr.meta()
        m['land'] = d
        data[k] = m
        print(k, m['w'], 'x', m['h'], n, 'points', len(d) // 1024, 'KB')
    # Greenland inset for the Viking map: the south of Greenland, top-left corner.
    gi = Proj(-56, 59.3, -28, 70.5, 64)
    d, n = land_path(polys50, gi, tol=0.3, min_area=0.4, margin=0.5)
    data['viking']['inset'] = dict(gi.meta(), land=d, x=0, y=0)
    print('viking inset', gi.w, 'x', gi.h, n, 'points')
    # The modern world: every country (for borders) plus the game's countries highlighted.
    ac = decode(countries)
    wp = Proj(-180, -58, 180, 80, 360, ky_scale=1.18)
    allp = []
    game = {'United States of America': 'United States', 'United Kingdom': 'United Kingdom', 'Canada': 'Canada', 'Australia': 'Australia', 'Mexico': 'Mexico', 'Brazil': 'Brazil',
            'Germany': 'Germany', 'France': 'France', 'Italy': 'Italy', 'Spain': 'Spain', 'Japan': 'Japan', 'South Korea': 'South Korea', 'India': 'India', 'Nigeria': 'Nigeria',
            'South Africa': 'South Africa', 'Philippines': 'Philippines', 'Jamaica': 'Jamaica'}
    out = {}
    for g in countries['objects']['countries']['geometries']:
        ps = polygons(ac, g)
        allp.extend(ps)
        name = g['properties']['name']
        if name not in game:
            continue
        rings = []
        best, at = 0, None
        for poly in ps:
            outer = poly[0]
            lon = sum(p[0] for p in outer) / len(outer)
            if name == 'France' and lon < -20:
                continue  # French Guiana and other overseas parts
            for r in poly:
                xy = [wp(p) for p in r]
                s = simplify(xy + [xy[0]], 0.3)[:-1]
                if len(s) >= 3:
                    rings.append(s)
            xy = [wp(p) for p in outer]
            ar = area(xy)
            if ar > best:
                best = ar
                at = [round(sum(p[0] for p in xy) / len(xy), 1), round(sum(p[1] for p in xy) / len(xy), 1)]
        out[game[name]] = {'d': path(rings), 'at': at}
    # Rings that run past the antimeridian also appear on the other side of the map.
    extra = []
    for poly in allp:
        for r in poly:
            if max(p[0] for p in r) > 180:
                extra.append([[(x - 360, y) for x, y in r]])
            if min(p[0] for p in r) < -180:
                extra.append([[(x + 360, y) for x, y in r]])
    d, n = land_path(allp + extra, wp, tol=0.45, min_area=0.3, margin=0)
    data['world'] = dict(wp.meta(), land=d, countries=out)
    print('world', wp.w, 'x', wp.h, n, 'points', len(d) // 1024, 'KB')
    js = ('/* TheLife: real coastlines for the world maps (js/maps.js). Generated by tools/build_maps.py\n'
          ' * from Natural Earth (public domain, naturalearthdata.com) via world-atlas. Do not edit by hand. */\n'
          'TL.mapdata = ' + json.dumps(data, separators=(',', ':'), ensure_ascii=False) + ';\n')
    with open(OUT, 'w') as f:
        f.write(js)
    print('wrote', OUT, len(js) // 1024, 'KB')


if __name__ == '__main__':
    main()
