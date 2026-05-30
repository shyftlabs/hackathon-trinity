"""
Supabase client singleton.
SHARED — do not edit without a PR.

Both student and teacher query modules import `get_client()` from here.
"""
from __future__ import annotations
import os
from functools import lru_cache
try:
    from supabase import create_client, Client as _SupabaseClient
    _SUPABASE_AVAILABLE = True
except ImportError:
    _SUPABASE_AVAILABLE = False
    _SupabaseClient = None  # type: ignore


def _require_supabase():
    if not _SUPABASE_AVAILABLE:
        raise RuntimeError(
            "supabase package not fully installed. Run: pip install supabase postgrest gotrue"
        )


@lru_cache(maxsize=1)
def get_client():
    """Return a cached Supabase service-role client."""
    _require_supabase()
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") or os.environ.get("SUPABASE_ANON_KEY", "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    return create_client(url, key)


def get_anon_client():
    """Return a client with the anon (public) key."""
    _require_supabase()
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
    return create_client(url, key)
