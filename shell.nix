let
  pkgs = import <nixpkgs> {};
in

pkgs.mkShell {
  buildInputs = with pkgs; [
    neovim
    (nodejs_22)
    nushell
  ];
  shellHook = ''
    nu
  '';
}

