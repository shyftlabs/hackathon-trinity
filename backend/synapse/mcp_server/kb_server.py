"""
Synapse AI Knowledge Base MCP Server.

FastMCP server exposing topic source material as tools for RAG retrieval.
Run standalone: python -m synapse.mcp_server.kb_server

Exposes tools:
  - ingest_syllabus(topics)       → registers a student's topic list
  - search_source_material(topic, query) → semantic search over corpus chunks
  - get_topic_sources(topic)      → all source chunks for a topic
  - list_topics()                 → available topics in the corpus
"""

from __future__ import annotations

import json
import math
import os
import sys
from typing import Any

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "continuum", "src"))

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("synapse-kb")

# ── Corpus — vetted undergraduate source material ──────────────────────────────
# Format: {topic: [{title, locator, text}, ...]}
CORPUS: dict[str, list[dict[str, str]]] = {
    "calculus": [
        {
            "title": "Calculus: Early Transcendentals, Stewart 9e",
            "locator": "Chapter 2, §2.1",
            "text": (
                "The derivative of a function f at a number a, denoted f'(a), is "
                "f'(a) = lim_{h→0} [f(a+h) - f(a)] / h if the limit exists. "
                "Geometrically, f'(a) is the slope of the tangent line to y=f(x) at (a, f(a)). "
                "A function is differentiable at a if f'(a) exists, which requires the function "
                "to be continuous at a — but continuity alone does not guarantee differentiability."
            ),
        },
        {
            "title": "Calculus: Early Transcendentals, Stewart 9e",
            "locator": "Chapter 3, §3.4",
            "text": (
                "The Chain Rule: If g is differentiable at x and f is differentiable at g(x), "
                "then the composite function h = f∘g defined by h(x) = f(g(x)) is differentiable "
                "at x and h'(x) = f'(g(x)) · g'(x). In Leibniz notation: dy/dx = (dy/du)(du/dx). "
                "Example: d/dx[sin(x²)] = cos(x²) · 2x."
            ),
        },
        {
            "title": "Calculus: Early Transcendentals, Stewart 9e",
            "locator": "Chapter 5, §5.3",
            "text": (
                "The Fundamental Theorem of Calculus Part 1: If f is continuous on [a,b], then the "
                "function g(x) = ∫_a^x f(t) dt is continuous on [a,b], differentiable on (a,b), "
                "and g'(x) = f(x). Part 2: ∫_a^b f(x) dx = F(b) - F(a), where F is any "
                "antiderivative of f. This theorem links differentiation and integration as "
                "inverse operations."
            ),
        },
        {
            "title": "Calculus: Early Transcendentals, Stewart 9e",
            "locator": "Chapter 4, §4.1",
            "text": (
                "A critical number of f is a number c in the domain where f'(c) = 0 or f'(c) does "
                "not exist. The Extreme Value Theorem states that if f is continuous on a closed "
                "interval [a,b], then f attains an absolute maximum and minimum on [a,b]. "
                "To find them: evaluate f at critical numbers and endpoints, then compare."
            ),
        },
    ],
    "linear algebra": [
        {
            "title": "Linear Algebra and Its Applications, Lay 5e",
            "locator": "Chapter 1, §1.3",
            "text": (
                "Vector equations: A vector equation x₁a₁ + x₂a₂ + ... + xₙaₙ = b has the same "
                "solution set as the linear system whose augmented matrix is [a₁ a₂ ... aₙ | b]. "
                "A vector b is in Span{a₁,...,aₙ} if and only if the linear system has a solution. "
                "The span of a set of vectors is all linear combinations of those vectors."
            ),
        },
        {
            "title": "Linear Algebra and Its Applications, Lay 5e",
            "locator": "Chapter 2, §2.2",
            "text": (
                "Matrix multiplication: If A is m×n and B is n×p, then the product AB is the m×p "
                "matrix whose columns are Ab₁, Ab₂, ..., Abₚ where bⱼ are columns of B. "
                "In general, AB ≠ BA (matrix multiplication is not commutative). "
                "An n×n matrix A is invertible iff it has n pivot positions, iff its columns "
                "span ℝⁿ, iff the equation Ax=0 has only the trivial solution."
            ),
        },
        {
            "title": "Linear Algebra and Its Applications, Lay 5e",
            "locator": "Chapter 5, §5.1",
            "text": (
                "Eigenvalues and eigenvectors: An eigenvector of an n×n matrix A is a nonzero "
                "vector x such that Ax = λx for some scalar λ, called the eigenvalue. "
                "The scalar λ is an eigenvalue of A iff det(A - λI) = 0 (the characteristic "
                "equation). The set of all solutions to (A - λI)x = 0 is the eigenspace of A "
                "corresponding to λ."
            ),
        },
        {
            "title": "Linear Algebra and Its Applications, Lay 5e",
            "locator": "Chapter 6, §6.4",
            "text": (
                "The Gram-Schmidt process: Given a basis {x₁,...,xₚ} for a subspace W, produces "
                "an orthogonal basis {v₁,...,vₚ}: v₁ = x₁; v₂ = x₂ - (x₂·v₁/v₁·v₁)v₁; etc. "
                "Every subspace has an orthonormal basis (divide each vₖ by ||vₖ||). "
                "QR decomposition: A = QR where Q has orthonormal columns and R is upper triangular."
            ),
        },
    ],
    "data structures": [
        {
            "title": "Introduction to Algorithms, CLRS 4e",
            "locator": "Chapter 3 — Growth of Functions",
            "text": (
                "Big-O notation: f(n) = O(g(n)) if there exist constants c > 0 and n₀ such that "
                "0 ≤ f(n) ≤ c·g(n) for all n ≥ n₀. Common complexities in increasing order: "
                "O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!). "
                "Θ(g(n)) means the function is both O(g(n)) and Ω(g(n)) — tight bound."
            ),
        },
        {
            "title": "Introduction to Algorithms, CLRS 4e",
            "locator": "Chapter 10 — Elementary Data Structures",
            "text": (
                "A linked list is a data structure in which objects are arranged in a linear order "
                "by pointers rather than indices. A doubly linked list L has attributes head and "
                "sentinel; each element has next and prev pointers. "
                "Search: Θ(n). Insert at head: O(1). Delete: O(1) given the element pointer. "
                "Arrays provide O(1) random access but O(n) insertion/deletion at arbitrary index."
            ),
        },
        {
            "title": "Introduction to Algorithms, CLRS 4e",
            "locator": "Chapter 12 — Binary Search Trees",
            "text": (
                "Binary Search Tree property: for any node x, if y is in x's left subtree then "
                "key[y] ≤ key[x]; if y is in x's right subtree then key[y] ≥ key[x]. "
                "In-order traversal visits nodes in sorted order in O(n). "
                "Search, insert, delete are O(h) where h is height. For a balanced BST (e.g. "
                "Red-Black tree, AVL tree), h = O(log n) guaranteeing O(log n) operations."
            ),
        },
        {
            "title": "Introduction to Algorithms, CLRS 4e",
            "locator": "Chapter 22 — Elementary Graph Algorithms",
            "text": (
                "Breadth-first search (BFS): given graph G=(V,E) and source s, explores edges to "
                "discover every reachable vertex. Time O(V+E). Computes shortest-path distances "
                "from s in an unweighted graph. Depth-first search (DFS): explores as deep as "
                "possible; time Θ(V+E). DFS produces a depth-first forest; back edges indicate "
                "cycles (undirected); topological sort via DFS on a DAG takes Θ(V+E)."
            ),
        },
    ],
    "statistics": [
        {
            "title": "Probability and Statistics for Engineering and the Sciences, DeVore 9e",
            "locator": "Chapter 2, §2.4",
            "text": (
                "Bayes' theorem: P(Aᵢ | B) = P(B | Aᵢ)P(Aᵢ) / Σⱼ P(B | Aⱼ)P(Aⱼ), "
                "where {A₁,...,Aₙ} are mutually exclusive and exhaustive. "
                "Prior probability P(Aᵢ) is updated to posterior P(Aᵢ|B) after observing event B. "
                "This is the foundation of Bayesian inference and spam filtering."
            ),
        },
        {
            "title": "Probability and Statistics for Engineering and the Sciences, DeVore 9e",
            "locator": "Chapter 4, §4.3",
            "text": (
                "Normal distribution N(μ, σ²): bell-shaped, symmetric about μ. "
                "68-95-99.7 rule: ~68% of values within 1σ, ~95% within 2σ, ~99.7% within 3σ. "
                "Z-score: z = (x - μ)/σ standardizes to N(0,1). "
                "Central Limit Theorem: sample mean X̄ from any distribution with finite μ,σ "
                "is approximately N(μ, σ²/n) for large n — justifies using z-tests broadly."
            ),
        },
        {
            "title": "Probability and Statistics for Engineering and the Sciences, DeVore 9e",
            "locator": "Chapter 9, §9.2",
            "text": (
                "Hypothesis testing: H₀ (null) vs Hₐ (alternative). "
                "Type I error: reject H₀ when it's true (probability α, significance level). "
                "Type II error: fail to reject H₀ when Hₐ is true (probability β). "
                "p-value: probability of observing a test statistic as extreme as computed, "
                "given H₀ is true. Reject H₀ if p-value < α. "
                "A t-test is used when σ is unknown and sample size is small."
            ),
        },
    ],
    "python programming": [
        {
            "title": "Fluent Python, Ramalho 2e",
            "locator": "Chapter 1 — The Python Data Model",
            "text": (
                "Python's data model defines how objects behave with built-in operations via "
                "dunder (double-underscore) methods. __len__ and __getitem__ make an object "
                "a sequence; __iter__ makes it iterable; __repr__ and __str__ control string "
                "representation. By implementing __enter__ and __exit__, any class can be used "
                "as a context manager (with statement)."
            ),
        },
        {
            "title": "Fluent Python, Ramalho 2e",
            "locator": "Chapter 7 — Functions as First-Class Objects",
            "text": (
                "Functions in Python are first-class objects: they can be stored in variables, "
                "passed as arguments, and returned from other functions. A closure is a function "
                "that retains bindings of free variables from the enclosing scope. "
                "Decorators are callables that take a function and return a modified version; "
                "@functools.wraps(func) preserves the original function's metadata."
            ),
        },
        {
            "title": "Fluent Python, Ramalho 2e",
            "locator": "Chapter 17 — Iterators, Generators, and Classic Coroutines",
            "text": (
                "A generator function uses yield to produce values lazily. When called it returns "
                "a generator object (an iterator). yield from can delegate to a sub-generator. "
                "List comprehensions [x*2 for x in range(10)] build lists eagerly; "
                "generator expressions (x*2 for x in range(10)) produce values on demand — "
                "saving memory for large sequences. async for / async with work with async "
                "iterators and context managers in async def coroutines."
            ),
        },
    ],
    "physics": [
        {
            "title": "University Physics, Young & Freedman 15e",
            "locator": "Chapter 4 — Newton's Laws of Motion",
            "text": (
                "Newton's First Law: A body at rest remains at rest, and a body in motion "
                "remains in uniform motion (constant velocity) unless acted upon by a net force. "
                "Second Law: ΣF = ma — the net force equals mass times acceleration. "
                "Third Law: For every action force there is an equal and opposite reaction force "
                "acting on the other body. Forces always occur in action-reaction pairs."
            ),
        },
        {
            "title": "University Physics, Young & Freedman 15e",
            "locator": "Chapter 7 — Potential Energy and Energy Conservation",
            "text": (
                "Work-Energy Theorem: The net work done on a particle equals the change in its "
                "kinetic energy: W_net = ΔKE = ½mv₂² - ½mv₁². "
                "Conservation of Mechanical Energy: In a system with only conservative forces, "
                "KE + PE = constant. For gravity near Earth's surface: PE = mgh. "
                "For a spring: PE = ½kx². When non-conservative forces (friction) act, "
                "W_nc = ΔKE + ΔPE — energy is converted to thermal energy."
            ),
        },
        {
            "title": "University Physics, Young & Freedman 15e",
            "locator": "Chapter 21 — Electric Charge and Electric Field",
            "text": (
                "Coulomb's Law: F = k|q₁q₂|/r², where k = 8.99×10⁹ N·m²/C². "
                "The electric field E at a point is the force per unit positive test charge: "
                "E = F/q₀. For a point charge Q: E = kQ/r² (magnitude). "
                "Field lines start on positive and end on negative charges; they never cross. "
                "Gauss's Law: the total electric flux through any closed surface equals "
                "Q_enc/ε₀ — simplifies E-field calculation for symmetric charge distributions."
            ),
        },
    ],
}

# Registered student syllabus topics
_student_syllabi: dict[str, list[str]] = {}


def _simple_similarity(query: str, text: str) -> float:
    """Word-overlap similarity — no external ML needed."""
    q_words = set(query.lower().split())
    t_words = set(text.lower().split())
    if not q_words or not t_words:
        return 0.0
    intersection = len(q_words & t_words)
    return intersection / math.sqrt(len(q_words) * len(t_words))


def _find_topic(topic: str) -> str | None:
    """Fuzzy-match a topic name to corpus keys."""
    topic_lower = topic.lower().strip()
    for key in CORPUS:
        if topic_lower == key or topic_lower in key or key in topic_lower:
            return key
    # word overlap fallback
    best_key, best_score = None, 0.0
    for key in CORPUS:
        score = _simple_similarity(topic_lower, key)
        if score > best_score:
            best_key, best_score = key, score
    return best_key if best_score > 0.1 else None


# ── MCP Tools ─────────────────────────────────────────────────────────────────

@mcp.tool()
def ingest_syllabus(student_id: str, topics: list[str]) -> dict[str, Any]:
    """Register a student's syllabus topic list. Returns which topics have source material."""
    matched, unmatched = [], []
    for t in topics:
        key = _find_topic(t)
        if key:
            matched.append({"requested": t, "matched_corpus_key": key})
        else:
            unmatched.append(t)
    _student_syllabi[student_id] = topics
    return {
        "student_id": student_id,
        "registered_topics": topics,
        "matched": matched,
        "unmatched_topics": unmatched,
        "available_corpus_topics": list(CORPUS.keys()),
    }


@mcp.tool()
def search_source_material(topic: str, query: str, top_k: int = 3) -> list[dict[str, str]]:
    """
    Search source material for a topic using a query string.
    Returns up to top_k chunks ranked by relevance.
    Each chunk includes: title, locator, text.
    """
    key = _find_topic(topic)
    if not key:
        return []
    chunks = CORPUS[key]
    scored = [
        (chunk, _simple_similarity(query, chunk["text"] + " " + chunk["title"]))
        for chunk in chunks
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [chunk for chunk, _ in scored[:top_k]]


@mcp.tool()
def get_topic_sources(topic: str) -> list[dict[str, str]]:
    """Return ALL source chunks for a topic."""
    key = _find_topic(topic)
    if not key:
        return []
    return CORPUS[key]


@mcp.tool()
def list_topics() -> list[str]:
    """List all topics available in the knowledge base."""
    return list(CORPUS.keys())


@mcp.tool()
def get_student_syllabus(student_id: str) -> dict[str, Any]:
    """Return the registered syllabus topics for a student."""
    topics = _student_syllabi.get(student_id, [])
    return {"student_id": student_id, "topics": topics}


if __name__ == "__main__":
    import uvicorn

    app = mcp.streamable_http_app()
    port = int(os.environ.get("KB_SERVER_PORT", "8888"))
    print(f"Synapse KB MCP server starting at http://localhost:{port}/mcp")
    uvicorn.run(app, host="0.0.0.0", port=port)
