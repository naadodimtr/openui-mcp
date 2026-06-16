#!/bin/bash
set -e

REPO="naadodimtr/openui-mcp"
INSTALL_DIR="${OPENUI_MCP_DIR:-$HOME/.openui-mcp}"
VERSION="${1:-latest}"

get_arch() {
  local arch
  arch=$(uname -m)
  case "$arch" in
    x86_64|amd64) echo "x64" ;;
    aarch64|arm64) echo "arm64" ;;
    *) echo "Unsupported architecture: $arch" >&2; exit 1 ;;
  esac
}

get_os() {
  local os
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  case "$os" in
    linux) echo "linux" ;;
    darwin) echo "darwin" ;;
    *) echo "Unsupported OS: $os" >&2; exit 1 ;;
  esac
}

get_latest_version() {
  curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | cut -d'"' -f4
}

OS=$(get_os)
ARCH=$(get_arch)

if [ "$VERSION" = "latest" ]; then
  VERSION=$(get_latest_version)
  if [ -z "$VERSION" ]; then
    echo "Error: Could not determine latest version" >&2
    exit 1
  fi
fi

ARTIFACT="openui-mcp-${OS}-${ARCH}"
URL="https://github.com/$REPO/releases/download/$VERSION/${ARTIFACT}.tar.gz"

echo "Installing openui-mcp $VERSION ($OS/$ARCH)..."
echo "  From: $URL"
echo "  To:   $INSTALL_DIR"

mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/specs"
echo '{"library": "kumo"}' > "$INSTALL_DIR/specs/config.json"

rm -f "$INSTALL_DIR/openui-mcp"
rm -rf "$INSTALL_DIR/kumo"

curl -fsSL "$URL" | tar -xz -C "$INSTALL_DIR"
chmod +x "$INSTALL_DIR/openui-mcp"

if [ -d "$INSTALL_DIR/kumo" ]; then
  "$INSTALL_DIR/openui-mcp" install-library "$INSTALL_DIR/kumo"
  rm -rf "$INSTALL_DIR/kumo"
fi

if ! echo "$PATH" | grep -q "$INSTALL_DIR"; then
  SHELL_RC=""
  if [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
  elif [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
  fi

  if [ -n "$SHELL_RC" ]; then
    echo "" >> "$SHELL_RC"
    echo "# openui-mcp" >> "$SHELL_RC"
    echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$SHELL_RC"
    echo "  Added $INSTALL_DIR to PATH in $SHELL_RC"
  fi
fi

echo ""
echo "  ✓ openui-mcp $VERSION installed successfully!"
echo ""

if [ -t 0 ] || [ -e /dev/tty ]; then
  "$INSTALL_DIR/openui-mcp" --setup < /dev/tty
else
  echo "  Run 'openui-mcp --setup' to configure your MCP client."
  echo "  Preview: http://localhost:6556 (default)"
fi

echo ""
echo "  Update later with: openui-mcp --update"
echo ""
