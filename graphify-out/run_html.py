import json
from graphify.build import build_from_json
from graphify.export import to_html
from pathlib import Path

extraction = json.loads(Path('graphify-out/.graphify_ast.json').read_text(encoding='utf-8'))
analysis = json.loads(Path('graphify-out/.graphify_analysis.json').read_text(encoding='utf-8'))

G = build_from_json(extraction)
communities = {int(k): v for k, v in analysis['communities'].items()}
labels = {cid: 'Community ' + str(cid) for cid in communities}

to_html(G, communities, 'graphify-out/graph.html', community_labels=labels)
print('graph.html generated')
