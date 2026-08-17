@echo off
rem Neko Maid Theme - one-click installer for DeepSeek Harness Web GUI
chcp 65001 >nul
echo ==============================================
echo  Neko Maid Theme (mao niang nv pu zhu ti) 安装程序
echo ==============================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
echo.
pause
