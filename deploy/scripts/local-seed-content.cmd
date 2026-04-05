@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0local-seed-content.ps1" %*
