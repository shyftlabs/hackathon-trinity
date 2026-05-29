"""
Synapse KB MCP Server — run standalone:
  python -m synapse.mcp_server.kb_server
"""
from __future__ import annotations
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "continuum", "src"))

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("synapse-kb")

CORPUS: dict[str, list[dict]] = {
    "calculus": [
        {"title":"Calculus: Early Transcendentals, Stewart 9e","locator":"Chapter 2, §2.1","text":"The derivative of f at a is f'(a)=lim_{h→0}[f(a+h)-f(a)]/h. Geometrically it is the slope of the tangent line at (a,f(a))."},
        {"title":"Calculus: Early Transcendentals, Stewart 9e","locator":"Chapter 3, §3.4","text":"Chain Rule: if g is differentiable at x and f at g(x), then (f∘g)'(x)=f'(g(x))·g'(x). Example: d/dx[sin(x²)]=cos(x²)·2x."},
        {"title":"Calculus: Early Transcendentals, Stewart 9e","locator":"Chapter 5, §5.3","text":"Fundamental Theorem Part 2: ∫_a^b f(x)dx = F(b)-F(a), where F is any antiderivative of f. Links differentiation and integration as inverse operations."},
        {"title":"Calculus: Early Transcendentals, Stewart 9e","locator":"Chapter 4, §4.1","text":"Extreme Value Theorem: if f is continuous on [a,b], it attains an absolute max and min. Find them by evaluating f at critical numbers (where f'=0 or undefined) and endpoints."},
    ],
    "linear algebra": [
        {"title":"Linear Algebra and Its Applications, Lay 5e","locator":"Chapter 1, §1.3","text":"Vector equation x₁a₁+...+xₙaₙ=b has the same solution set as the linear system [a₁...aₙ|b]. b is in Span{a₁,...,aₙ} iff the system is consistent."},
        {"title":"Linear Algebra and Its Applications, Lay 5e","locator":"Chapter 2, §2.2","text":"Matrix multiplication AB: (AB)ᵢⱼ=row i of A dotted with col j of B. In general AB≠BA. A is invertible iff det(A)≠0 iff columns are linearly independent."},
        {"title":"Linear Algebra and Its Applications, Lay 5e","locator":"Chapter 5, §5.1","text":"Eigenvalue λ of A: Ax=λx for nonzero x. Found via characteristic equation det(A-λI)=0. Eigenspace = null space of (A-λI)."},
        {"title":"Linear Algebra and Its Applications, Lay 5e","locator":"Chapter 6, §6.4","text":"Gram-Schmidt: given basis {x₁,...,xₚ}, produces orthogonal basis by subtracting projections. QR decomposition: A=QR, Q orthonormal columns, R upper triangular."},
    ],
    "data structures": [
        {"title":"Introduction to Algorithms, CLRS 4e","locator":"Chapter 3 — Growth of Functions","text":"Big-O: f(n)=O(g(n)) if ∃c>0,n₀ such that 0≤f(n)≤c·g(n) for n≥n₀. Order: O(1)<O(log n)<O(n)<O(n log n)<O(n²)<O(2ⁿ)."},
        {"title":"Introduction to Algorithms, CLRS 4e","locator":"Chapter 10 — Elementary Data Structures","text":"Doubly linked list: each node has next/prev. Search O(n), insert at head O(1), delete O(1) given pointer. Arrays: O(1) access, O(n) insert/delete at arbitrary position."},
        {"title":"Introduction to Algorithms, CLRS 4e","locator":"Chapter 12 — Binary Search Trees","text":"BST property: left subtree keys ≤ node key ≤ right subtree keys. In-order traversal visits keys sorted in O(n). Search/insert/delete O(h); balanced BST gives h=O(log n)."},
        {"title":"Introduction to Algorithms, CLRS 4e","locator":"Chapter 22 — Elementary Graph Algorithms","text":"BFS: O(V+E), computes shortest-path distances in unweighted graphs. DFS: Θ(V+E), back edges indicate cycles. Topological sort via DFS on DAG in Θ(V+E)."},
    ],
    "statistics": [
        {"title":"Probability and Statistics for Engineering, DeVore 9e","locator":"Chapter 2, §2.4","text":"Bayes': P(Aᵢ|B)=P(B|Aᵢ)P(Aᵢ)/ΣP(B|Aⱼ)P(Aⱼ). Prior updated to posterior after observing event B."},
        {"title":"Probability and Statistics for Engineering, DeVore 9e","locator":"Chapter 4, §4.3","text":"Normal N(μ,σ²): 68-95-99.7 rule. Z=(x-μ)/σ standardizes to N(0,1). CLT: X̄≈N(μ,σ²/n) for large n — justifies z-tests broadly."},
        {"title":"Probability and Statistics for Engineering, DeVore 9e","locator":"Chapter 9, §9.2","text":"Hypothesis testing: Type I error α (reject true H₀), Type II error β (fail to reject false H₀). p-value: reject H₀ if p<α. t-test used when σ unknown and n small."},
    ],
    "python programming": [
        {"title":"Fluent Python, Ramalho 2e","locator":"Chapter 1 — The Python Data Model","text":"Dunder methods define how objects behave with built-ins: __len__, __getitem__ → sequence; __iter__ → iterable; __enter__/__exit__ → context manager."},
        {"title":"Fluent Python, Ramalho 2e","locator":"Chapter 7 — Functions as First-Class Objects","text":"Functions are first-class: stored in variables, passed as args, returned from functions. Decorators = callables that wrap functions; @functools.wraps preserves metadata."},
        {"title":"Fluent Python, Ramalho 2e","locator":"Chapter 17 — Generators","text":"Generator functions use yield to produce values lazily. Generator expressions (x*2 for x in ...) vs list comprehensions [x*2 for x in ...]: former is lazy, saves memory."},
    ],
    "physics": [
        {"title":"University Physics, Young & Freedman 15e","locator":"Chapter 4 — Newton's Laws","text":"1st: body stays at rest or constant velocity unless net force acts. 2nd: ΣF=ma. 3rd: action-reaction pairs — forces always equal and opposite on different bodies."},
        {"title":"University Physics, Young & Freedman 15e","locator":"Chapter 7 — Energy Conservation","text":"Work-Energy Theorem: W_net=ΔKE. Conservation: KE+PE=constant for conservative forces. PE_gravity=mgh; PE_spring=½kx². Friction converts mechanical energy to thermal."},
        {"title":"University Physics, Young & Freedman 15e","locator":"Chapter 21 — Electric Fields","text":"Coulomb's Law: F=k|q₁q₂|/r², k=8.99×10⁹ N·m²/C². Electric field E=F/q₀=kQ/r². Gauss's Law: flux through closed surface = Q_enc/ε₀."},
    ],
}

_syllabi: dict[str, list[str]] = {}


def _sim(q: str, t: str) -> float:
    a, b = set(q.lower().split()), set(t.lower().split())
    return len(a & b) / math.sqrt(len(a) * len(b)) if a and b else 0.0


def _match(topic: str) -> str | None:
    t = topic.lower().strip()
    for k in CORPUS:
        if t == k or t in k or k in t:
            return k
    best, best_s = None, 0.0
    for k in CORPUS:
        s = _sim(t, k)
        if s > best_s:
            best, best_s = k, s
    return best if best_s > 0.1 else None


@mcp.tool()
def ingest_syllabus(student_id: str, topics: list[str]) -> dict:
    """Register a student's syllabus. Returns matched/unmatched topics."""
    matched, unmatched = [], []
    for t in topics:
        k = _match(t)
        (matched if k else unmatched).append({"requested": t, "corpus_key": k} if k else t)
    _syllabi[student_id] = topics
    return {"student_id": student_id, "matched": matched, "unmatched": unmatched, "available": list(CORPUS)}


@mcp.tool()
def search_source_material(topic: str, query: str, top_k: int = 3) -> list[dict]:
    """Search source material by relevance to query. Returns chunks with title/locator/text."""
    k = _match(topic)
    if not k:
        return []
    scored = sorted(CORPUS[k], key=lambda c: _sim(query, c["text"] + " " + c["title"]), reverse=True)
    return scored[:top_k]


@mcp.tool()
def get_topic_sources(topic: str) -> list[dict]:
    """Return ALL source chunks for a topic."""
    k = _match(topic)
    return CORPUS[k] if k else []


@mcp.tool()
def list_topics() -> list[str]:
    """List all topics in the knowledge base."""
    return list(CORPUS)


@mcp.tool()
def get_student_syllabus(student_id: str) -> dict:
    """Return registered syllabus for a student."""
    return {"student_id": student_id, "topics": _syllabi.get(student_id, [])}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("KB_SERVER_PORT", "8888"))
    print(f"Synapse KB MCP server → http://localhost:{port}/mcp")
    uvicorn.run(mcp.streamable_http_app(), host="0.0.0.0", port=port)
