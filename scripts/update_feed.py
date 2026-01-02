#!/usr/bin/env python3
"""Script to update the odds feed.

This is a convenience wrapper around the CLI for use in automation.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from ante_ai.cli import main

if __name__ == "__main__":
    sys.exit(main())
