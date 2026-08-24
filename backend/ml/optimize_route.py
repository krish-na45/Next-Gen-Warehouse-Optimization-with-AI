"""
Warehouse Route Optimization
- Models warehouse as a weighted graph
- Uses Dijkstra's algorithm to find shortest picking path
- Returns ordered list of aisles and total distance
"""

import heapq
from typing import List, Dict, Tuple

# Warehouse grid: nodes are aisle IDs (1-20), edges with distances
# In a real system this would come from a warehouse layout DB
def build_warehouse_graph(num_aisles: int = 20) -> Dict[int, List[Tuple[int, float]]]:
    """Build adjacency list. Adjacent aisles are connected; cross-aisle shortcuts exist."""
    graph = {i: [] for i in range(1, num_aisles + 1)}
    for i in range(1, num_aisles):
        dist = round(5.0 + (i % 3) * 2.5, 1)   # variable aisle lengths
        graph[i].append((i + 1, dist))
        graph[i + 1].append((i, dist))
    # Cross-aisle shortcuts every 5 aisles
    for i in range(1, num_aisles - 4, 5):
        shortcut = round(3.0, 1)
        graph[i].append((i + 5, shortcut))
        graph[i + 5].append((i, shortcut))
    return graph


def dijkstra(graph: Dict, start: int, end: int) -> Tuple[float, List[int]]:
    """Returns (total_distance, path) from start to end."""
    dist = {node: float("inf") for node in graph}
    dist[start] = 0
    prev = {node: None for node in graph}
    heap = [(0, start)]

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            nd = dist[u] + w
            if nd < dist[v]:
                dist[v] = nd
                prev[v] = u
                heapq.heappush(heap, (nd, v))

    # Reconstruct path
    path, cur = [], end
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    return round(dist[end], 2), path


def optimize_picking_route(aisle_list: List[int], start_aisle: int = 1) -> Dict:
    """
    Given a list of aisles to visit, compute the optimal visiting order
    using a greedy nearest-neighbor heuristic + Dijkstra between stops.
    Returns total distance and ordered route.
    """
    graph = build_warehouse_graph()
    unvisited = list(set(aisle_list))
    current = start_aisle
    full_path = [current]
    total_dist = 0.0
    order = []

    while unvisited:
        # Find nearest unvisited aisle
        best_dist = float("inf")
        best_node = None
        best_segment = []
        for target in unvisited:
            d, seg = dijkstra(graph, current, target)
            if d < best_dist:
                best_dist = d
                best_node = target
                best_segment = seg
        total_dist += best_dist
        full_path.extend(best_segment[1:])
        order.append(best_node)
        unvisited.remove(best_node)
        current = best_node

    # Return to start
    d_back, seg_back = dijkstra(graph, current, start_aisle)
    total_dist += d_back
    full_path.extend(seg_back[1:])

    return {
        "optimized_order": order,
        "full_path": full_path,
        "total_distance_meters": round(total_dist, 2),
        "estimated_time_minutes": round(total_dist / 50, 2),  # ~50m/min walking
    }


if __name__ == "__main__":
    result = optimize_picking_route([5, 12, 3, 18, 7])
    print(result)
