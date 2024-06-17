@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe" "%~dp0\node_modules\asmx-g2\kernel.js" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node "%~dp0\node_modules\asmx-g2\kernel.js" %*
)