let
  pkgs = import <nixpkgs> {};
in

pkgs.mkShell {
  buildInputs = with pkgs; [
    neovim
    (nodejs_20)
    nushell
  ];
  shellHook = ''
    nu
  '';
}

