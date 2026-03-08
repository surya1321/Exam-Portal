---
name: data-structures-algorithms
description: "Select optimal data structures and algorithms to improve code performance during refactoring. Use this skill whenever refactoring code for performance, reviewing algorithmic complexity, optimizing loops or data lookups, replacing brute-force approaches, analyzing Big O complexity, reducing memory usage, or improving scalability. Trigger on: refactoring sessions, performance optimization, code reviews involving complexity concerns, replacing inefficient patterns, or any task where choosing the right data structure or algorithm matters — even if the user doesn't explicitly mention 'data structures' or 'algorithms'."
---

# Data Structures & Algorithms — Optimal Choices for Production Code

## Why This Matters

The difference between an O(n²) and an O(n log n) solution is invisible at 100 items — and catastrophic at 1,000,000. Choosing the right data structure or algorithm isn't an academic exercise; it's the difference between a feature that scales to production and one that collapses under real-world load.

But optimization has a cost too. Code that is "clever" but unreadable is a maintenance nightmare. The goal is not to apply the fanciest algorithm — it's to choose the **right** one: the simplest solution that meets the performance requirements of the actual problem.

## The Core Principle

> **Optimize for the bottleneck, not for elegance. If the current solution is already optimal for the problem size, leave it alone.**

Never refactor working code into a more complex solution unless the performance gain is measurable and justified. The best data structure is the one that makes the code both fast *and* understandable.

---

## Workflow — How To Apply This Skill

When analyzing code during a refactoring session, follow these four steps in order:

### Step 1: Assess the Current Implementation

Before suggesting anything, understand what exists:

1. **Identify the time complexity** — best, average, and worst case (Big O)
2. **Identify the space complexity** — memory allocations, auxiliary data structures
3. **Identify the bottleneck** — is the slow part a loop, a lookup, a sort, an I/O call?
4. **Identify the data characteristics** — how large is `n`? Is it bounded? Is input sorted? Are there duplicates?

Document this analysis before proposing changes. If the implementation is already optimal — say so and explain why.

### Step 2: Evaluate Improvement Opportunities

For each identified bottleneck, consider:

| Question | Why It Matters |
|----------|---------------|
| Can I reduce time complexity by a full class? (e.g., O(n²) → O(n log n)) | Class reductions yield massive gains at scale |
| Can I trade space for time? (e.g., hash map for O(1) lookup) | Often the most practical optimization |
| Can I eliminate redundant work? (e.g., memoization, caching) | Sometimes the algorithm is fine; it's just doing too much |
| Is the input size bounded/small? | If `n < 100`, a simpler O(n²) may outperform a complex O(n log n) due to constant factors |
| Will this change hurt readability or maintainability? | A 10% speed improvement isn't worth doubling code complexity |

### Step 3: Judge — Refactor or Retain

**Retain** the current implementation when:
- It's already at optimal time complexity for the problem
- The data size is small or bounded (n < ~1000 and performance is acceptable)
- The simpler solution has better constant factors for typical input sizes
- The trade-off in readability/maintainability outweighs the gains
- The bottleneck is I/O-bound, not CPU-bound (a better algorithm won't help)

**Refactor** when:
- There's a class reduction in complexity (e.g., O(n²) → O(n), O(n) → O(log n))
- The data size is unbounded or known to be large
- Profiling or monitoring confirms this code path is a performance issue
- The improved solution is equally readable or only marginally more complex

### Step 4: Recommend & Implement

When recommending a change:
1. State the **before** complexity and **after** complexity
2. Explain **why** this data structure / algorithm is the right fit
3. Note any **trade-offs** introduced (memory, complexity, edge cases)
4. Provide the **production-ready** refactored code — clean, idiomatic, no shortcuts

---

## Data Structure Selection Guide

Use this table to quickly identify the right data structure for the operation profile:

### Quick Reference — Operations & Ideal Structures

| Primary Operation | Best Data Structure | Time Complexity | When To Use |
|-------------------|-------------------|-----------------|-------------|
| Key-value lookup | Hash Map / Hash Set | O(1) avg | Fast membership tests, deduplication, counting |
| Sorted order access | Balanced BST / Sorted Array | O(log n) | Range queries, ordered traversal, rank queries |
| Min/Max retrieval | Heap (Min/Max) | O(1) get, O(log n) insert | Priority queues, top-K problems, scheduling |
| FIFO processing | Queue / Deque | O(1) enqueue/dequeue | BFS, task scheduling, sliding windows |
| LIFO processing | Stack | O(1) push/pop | DFS, undo operations, expression parsing |
| Prefix matching | Trie | O(m) where m = key length | Autocomplete, spell check, IP routing |
| Range sum / update | Segment Tree / Fenwick Tree | O(log n) query/update | Range queries with updates, interval problems |
| Connected components | Disjoint Set (Union-Find) | O(α(n)) ≈ O(1) | Network connectivity, Kruskal's MST |
| Probabilistic membership | Bloom Filter | O(k) where k = hash functions | Cache lookup, duplicate detection at massive scale |
| Ordered insert + search | Skip List | O(log n) avg | Lock-free concurrent maps, in-memory databases |
| Sequential access | Array / Dynamic Array | O(1) index, O(n) search | When order matters and access is by index |
| Frequent insert/delete at ends | Linked List / Deque | O(1) at ends | When you never need random access |

### Detailed Data Structure Profiles

#### Arrays & Dynamic Arrays
| Operation | Time | Notes |
|-----------|------|-------|
| Access by index | O(1) | Fastest random access |
| Search (unsorted) | O(n) | Must scan all elements |
| Search (sorted) | O(log n) | Binary search |
| Insert at end | O(1) amortized | Dynamic arrays double capacity |
| Insert at beginning/middle | O(n) | Must shift all subsequent elements |
| Delete at beginning/middle | O(n) | Must shift all subsequent elements |

**Use when**: You need fast random access, data is mostly read, and size is relatively stable.
**Avoid when**: Frequent insertions/deletions in the middle.

#### Hash Maps & Hash Sets
| Operation | Avg | Worst | Notes |
|-----------|-----|-------|-------|
| Insert | O(1) | O(n) | Worst case on hash collision |
| Delete | O(1) | O(n) | Rare in practice with good hash |
| Lookup | O(1) | O(n) | The primary reason to use them |
| Space | O(n) | — | Additional memory overhead |

**Use when**: You need fast lookups, counting, deduplication, or group-by operations.
**Avoid when**: You need sorted order, or memory is extremely constrained.

**Common refactoring pattern:**
```
❌ Before: Nested loop to find matches — O(n²)
   for item in list_a:
       for other in list_b:
           if item.id == other.id: ...

✅ After: Hash set for O(1) lookup — O(n)
   set_b_ids = {other.id for other in list_b}
   for item in list_a:
       if item.id in set_b_ids: ...
```

#### Trees (BST, AVL, Red-Black)
| Operation | AVL/Red-Black | Unbalanced BST |
|-----------|--------------|----------------|
| Search | O(log n) | O(n) worst |
| Insert | O(log n) | O(n) worst |
| Delete | O(log n) | O(n) worst |
| Min/Max | O(log n) | O(n) worst |

**Use when**: You need sorted data with dynamic insertions/deletions. Range queries. Ordered iteration.
**Avoid when**: A hash map suffices (you don't need ordering).

#### Heaps (Min-Heap / Max-Heap)
| Operation | Time | Notes |
|-----------|------|-------|
| Find min/max | O(1) | Only the top element |
| Insert | O(log n) | Bubble up |
| Extract min/max | O(log n) | Bubble down |
| Arbitrary search | O(n) | Heaps aren't for searching |

**Use when**: You repeatedly need the smallest/largest element. Top-K problems. Task scheduling by priority.
**Avoid when**: You need to search for arbitrary elements or need sorted traversal.

**Common refactoring pattern:**
```
❌ Before: Sort entire array to find top K — O(n log n)

✅ After: Min-heap of size K — O(n log K)
   (Significantly faster when K << n)
```

#### Tries (Prefix Trees)
| Operation | Time | Notes |
|-----------|------|-------|
| Search | O(m) | m = length of key |
| Insert | O(m) | m = length of key |
| Prefix search | O(m + results) | The killer feature |
| Space | O(alphabet × nodes) | Can be large |

**Use when**: Prefix matching, autocomplete, dictionary lookups, IP routing tables.
**Avoid when**: Non-string keys; when a hash map is sufficient.

#### Graphs (Adjacency List vs. Adjacency Matrix)
| Operation | Adjacency List | Adjacency Matrix |
|-----------|---------------|-----------------|
| Space | O(V + E) | O(V²) |
| Check edge exists | O(degree) | O(1) |
| Find all neighbors | O(degree) | O(V) |
| Add edge | O(1) | O(1) |

**Use Adjacency List when**: Sparse graph (E << V²) — most real-world graphs.
**Use Adjacency Matrix when**: Dense graph, or you need O(1) edge checks.

---

## Algorithm Selection Guide

### Sorting

| Algorithm | Best | Average | Worst | Space | Stable? | When To Use |
|-----------|------|---------|-------|-------|---------|-------------|
| Built-in sort (TimSort) | O(n) | O(n log n) | O(n log n) | O(n) | ✅ | **Default choice** — always start here |
| Counting Sort | O(n + k) | O(n + k) | O(n + k) | O(k) | ✅ | Integer keys in small range |
| Radix Sort | O(d × n) | O(d × n) | O(d × n) | O(n + k) | ✅ | Fixed-length integers or strings |
| Bucket Sort | O(n + k) | O(n + k) | O(n²) | O(n + k) | ✅ | Uniformly distributed data |
| Quick Select | — | O(n) | O(n²) | O(1) | ❌ | Finding k-th element without full sort |

**Rule of thumb**: Use the language's built-in sort unless you have a specific reason not to. It's TimSort under the hood in Python and Java — already highly optimized for real-world data.

### Searching

| Algorithm | Time | Prerequisite | When To Use |
|-----------|------|-------------|-------------|
| Linear Search | O(n) | None | Unsorted data, small collections |
| Binary Search | O(log n) | Sorted data | Sorted arrays, finding boundaries |
| Hash Lookup | O(1) avg | Hash map | When you control the data structure |
| Interpolation Search | O(log log n) avg | Sorted + uniform | Uniformly distributed numeric data |

**Common refactoring pattern:**
```
❌ Before: Linear search in sorted array — O(n)
   found = any(x == target for x in sorted_data)

✅ After: Binary search — O(log n)
   index = bisect.bisect_left(sorted_data, target)
   found = index < len(sorted_data) and sorted_data[index] == target
```

### Graph Algorithms

| Problem | Algorithm | Time | When To Use |
|---------|-----------|------|-------------|
| Shortest path (unweighted) | BFS | O(V + E) | Unweighted graphs, level-order traversal |
| Shortest path (non-negative weights) | Dijkstra | O((V + E) log V) | GPS navigation, network routing |
| Shortest path (negative weights) | Bellman-Ford | O(V × E) | When negative weights exist |
| Shortest path (all pairs) | Floyd-Warshall | O(V³) | Small graphs, precomputing all distances |
| Minimum spanning tree | Kruskal / Prim | O(E log E) | Network design, clustering |
| Topological sort | Kahn's / DFS | O(V + E) | Build systems, task scheduling |
| Connected components | Union-Find / DFS | O(V + E) | Network analysis, grouping |
| Cycle detection | DFS with coloring | O(V + E) | Dependency validation, deadlock detection |

### String Algorithms

| Problem | Algorithm | Time | When To Use |
|---------|-----------|------|-------------|
| Pattern matching | Built-in methods | O(n × m) worst | **Default** — usually fast enough |
| Pattern matching (guaranteed) | KMP | O(n + m) | Large texts where worst case matters |
| Multiple pattern matching | Aho-Corasick | O(n + m + z) | Searching for many patterns simultaneously |
| Pattern matching (probabilistic) | Rabin-Karp | O(n + m) avg | Multiple pattern lengths, plagiarism detection |

---

## Common Optimization Patterns

These are recurring patterns where a specific technique unlocks a complexity class reduction:

### 1. Two Pointers
**Reduces**: O(n²) brute-force pair finding → O(n)
**Use when**: Working with sorted arrays, finding pairs that satisfy a condition.
```
Problem: Find two numbers in a sorted array that sum to target
❌ O(n²): Check every pair
✅ O(n):  Left pointer at start, right at end. Move inward based on sum.
```

### 2. Sliding Window
**Reduces**: O(n × k) brute-force subarray analysis → O(n)
**Use when**: Finding subarrays/substrings with a specific property (max sum, distinct elements, etc.)
```
Problem: Maximum sum of k consecutive elements
❌ O(n × k): Recalculate sum for each window
✅ O(n):     Subtract outgoing element, add incoming element
```

### 3. Hash Map Lookup
**Reduces**: O(n²) nested loop matching → O(n)
**Use when**: Checking membership, counting, grouping, or finding complements.
```
Problem: Find if any two numbers sum to target
❌ O(n²): Check every pair
✅ O(n):  For each number, check if (target - number) is in a hash set
```

### 4. Memoization / Dynamic Programming
**Reduces**: Exponential O(2ⁿ) recursive computation → O(n) or O(n²)
**Use when**: Overlapping subproblems — the same computation is being repeated.
```
Problem: Fibonacci numbers
❌ O(2ⁿ): Naive recursion recalculates same values exponentially
✅ O(n):  Cache results, each value computed exactly once
```

### 5. Divide & Conquer
**Reduces**: O(n²) → O(n log n) for problems that can be split
**Use when**: The problem can be broken into independent subproblems, solved separately, and merged.

### 6. Monotonic Stack / Queue
**Reduces**: O(n²) brute-force nearest greater/smaller queries → O(n)
**Use when**: "Next greater element", "largest rectangle in histogram", sliding window min/max.

### 7. Precomputation (Prefix Sums, Sparse Tables)
**Reduces**: O(n) per range query → O(1) per query after O(n) setup
**Use when**: Many range sum/min/max queries on static data.

### 8. Greedy Algorithms
**Achieves**: Optimal solutions in O(n log n) or better when the problem has greedy choice property
**Use when**: The locally optimal choice leads to the globally optimal solution (interval scheduling, Huffman coding, activity selection).

---

## Anti-Patterns — What To Reject

These patterns signal performance issues and should be flagged during review:

### 1. Nested Loops for Lookup
```
❌ for item in list_a:
       if item in list_b:  # O(n) search inside O(n) loop = O(n²)

✅ set_b = set(list_b)     # O(n) build
   for item in list_a:
       if item in set_b:   # O(1) lookup = O(n) total
```

### 2. Sorting When You Only Need the Extremes
```
❌ sorted(data)[-3:]        # O(n log n) to find 3 largest?

✅ heapq.nlargest(3, data)  # O(n log 3) ≈ O(n)
```

### 3. Repeated Concatenation in Loops
```
❌ result = ""
   for s in strings:
       result += s           # O(n²) — creates new string each iteration

✅ result = "".join(strings)  # O(n) — single allocation
```

### 4. Recalculating What Can Be Cached
```
❌ def get_total(items):      # Called 1000 times with same input
       return sum(i.price for i in items)

✅ @lru_cache or precompute once and invalidate on change
```

### 5. Using a List as a Queue
```
❌ queue = []
   queue.append(item)
   item = queue.pop(0)       # O(n) — shifts all elements

✅ from collections import deque
   queue = deque()
   queue.append(item)
   item = queue.popleft()    # O(1)
```

### 6. Linear Search in Sorted Data
```
❌ target in sorted_list      # O(n) — ignores the fact that data is sorted

✅ bisect.bisect_left(sorted_list, target)  # O(log n)
```

### 7. Building Graphs with Adjacency Matrices for Sparse Data
```
❌ graph = [[0] * n for _ in range(n)]  # O(V²) space for sparse graph

✅ graph = defaultdict(list)             # O(V + E) space
```

---

## Complexity Cheat Sheet

### Time Complexity Rankings (fastest → slowest)

| Complexity | Name | Example | 1M Items |
|------------|------|---------|----------|
| O(1) | Constant | Hash lookup, array index | 1 op |
| O(log n) | Logarithmic | Binary search | 20 ops |
| O(n) | Linear | Single loop scan | 1M ops |
| O(n log n) | Linearithmic | Merge sort, heap sort | 20M ops |
| O(n²) | Quadratic | Nested loops | 1T ops ⚠️ |
| O(n³) | Cubic | Triple nested loops | 10¹⁸ ops 🚫 |
| O(2ⁿ) | Exponential | Naive recursion (subsets) | ∞ 🚫 |
| O(n!) | Factorial | Permutation brute-force | ∞ 🚫 |

### Practical Limits (approximate, ~10⁸ operations/sec)

| Max n | Feasible Complexity | Example Algorithm |
|-------|-------------------|-------------------|
| n ≤ 10 | O(n!) | Brute-force permutation |
| n ≤ 20 | O(2ⁿ) | Subset enumeration with bitmask |
| n ≤ 500 | O(n³) | Floyd-Warshall, some DP |
| n ≤ 10⁴ | O(n²) | Simple nested loops |
| n ≤ 10⁶ | O(n log n) | Sorting, divide & conquer |
| n ≤ 10⁸ | O(n) | Linear scan, hash-based |
| n ≤ 10¹⁸ | O(log n) or O(1) | Binary search, math |

---

## Applying This Skill

When refactoring code for performance:

1. **Profile first, optimize second** — Don't guess where the bottleneck is. Use profiling tools (cProfile, Chrome DevTools, flame graphs) to identify the actual hot path. The slowest code is often not where you think it is.

2. **Measure the data size** — An O(n²) solution that runs on 50 items is probably fine. An O(n log n) solution that runs on 10 million items is essential. Context determines whether optimization is warranted.

3. **Prefer standard library** — Language built-in sorts, hash maps, and search functions are battle-tested, optimized, and readable. Reach for custom implementations only when the standard library doesn't fit.

4. **Explain the trade-off** — Every optimization has a cost. When you change a data structure, document what was gained (time complexity), what was lost (memory, readability), and why the trade-off is worth it.

5. **Don't over-engineer** — If the code is fast enough, readable, and maintainable — leave it alone. Premature optimization is a real cost: more code to maintain, harder to debug, and often solving problems that don't exist yet.
