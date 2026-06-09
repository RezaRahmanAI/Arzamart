import json
from pathlib import Path
from collections import defaultdict

# Load the graph
graph_data = json.loads(Path("graphify-out/graph.json").read_text(encoding="utf-8"))

nodes = {n["id"]: n for n in graph_data.get("nodes", [])}
edges = graph_data.get("edges", [])

# Analyze structure
print("=== ARCHITECTURAL ANALYSIS ===\n")

# 1. Find duplicate/similar nodes
print("1. POTENTIAL DUPLICATES & NAMING ISSUES:")
labels = defaultdict(list)
for node in nodes.values():
    label = node.get("label", "").lower()
    if "service" in label or "controller" in label or "interface" in label:
        labels[label].append(node["id"])

duplicates = {k: v for k, v in labels.items() if len(v) > 1}
if duplicates:
    for label, ids in sorted(duplicates.items())[:10]:
        print(f"   Multiple nodes with '{label}':")
        for node_id in ids:
            print(f"     - {node_id}")
else:
    print("   No obvious duplicate labels found")

# 2. Analyze edge types
print("\n2. EDGE RELATIONSHIPS:")
edge_types = defaultdict(int)
for edge in edges:
    relation = edge.get("relation", "unknown")
    edge_types[relation] += 1

for relation, count in sorted(edge_types.items(), key=lambda x: x[1], reverse=True):
    print(f"   {relation}: {count}")

# 3. Find nodes with excessive connections (possible god objects)
print("\n3. HIGH-CONNECTIVITY NODES (potential god objects):")
node_degree = defaultdict(int)
for edge in edges:
    node_degree[edge["source"]] += 1
    node_degree[edge["target"]] += 1

for node_id, degree in sorted(node_degree.items(), key=lambda x: x[1], reverse=True)[:15]:
    if node_id in nodes:
        label = nodes[node_id].get("label", node_id)
        print(f"   {label}: {degree} connections")

# 4. Find nodes with no edges (dead code)
print("\n4. POTENTIAL DEAD CODE (isolated nodes):")
connected = set()
for edge in edges:
    connected.add(edge["source"])
    connected.add(edge["target"])

dead_nodes = [n for n in nodes.values() if n["id"] not in connected and n.get("file_type") == "code"]
if dead_nodes:
    for node in dead_nodes[:15]:
        print(f"   {node.get('label', node['id'])}")
else:
    print("   No isolated code nodes found")

print(f"\n5. PROJECT STATS:")
print(f"   Total nodes: {len(nodes)}")
print(f"   Total edges: {len(edges)}")
print(f"   Connected code nodes: {len([n for n in nodes.values() if n['id'] in connected and n.get('file_type') == 'code'])}")
print(f"   Code nodes in graph: {len([n for n in nodes.values() if n.get('file_type') == 'code'])}")
