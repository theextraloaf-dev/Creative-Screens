"""Build a diorama scene live, inside the user's open Blender (through the Blender MCP), so it can be watched.

From the MCP:   exec(open(r'F:/Creative-Screens-main/Creative-Screens-main/3d/live.py').read()); result = run('build_street')
The build scripts stay the single source of truth: this only loads one into a fresh namespace (with __file__, so its
paths resolve), calls its build(), tidies the scene, frames the main camera in Material Preview and saves the .blend.
Bakes, exports and film renders stay headless (npm run diorama:export) because they would freeze the window for minutes.
"""
import bpy, os, sys, time

LIVE_DIR = r'F:/Creative-Screens-main/Creative-Screens-main/3d'
BLENDS = {'build_street': 'street.blend', 'build_map': 'oman-map.blend', 'build_intro': 'intro.blend'}
CAMERAS = {'build_street': 'CAM_overview', 'build_map': 'CAM_map', 'build_intro': 'CAM_intro'}

def run(script):
    t0 = time.time()
    path = os.path.join(LIVE_DIR, f'{script}.py')
    for p in (LIVE_DIR, os.path.join(LIVE_DIR, 'map')):
        if p not in sys.path:
            sys.path.insert(0, p)
    for m in ('kit', 'geo'):                       # pick up edits made since the last run
        sys.modules.pop(m, None)
    ns = {'__file__': path, '__name__': 'diorama_live'}
    exec(compile(open(path, encoding='utf-8').read(), path, 'exec'), ns)
    ns['build']()
    cam = bpy.data.objects.get(CAMERAS[script])
    tidy = ns['tidy_scene'](cam)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(LIVE_DIR, BLENDS[script]))
    return {'script': script, 'seconds': round(time.time() - t0, 1), 'objects': len(bpy.context.scene.objects),
            'collections': sorted(c.name for c in bpy.context.scene.collection.children), 'tidy': tidy,
            'saved': bpy.data.filepath}
