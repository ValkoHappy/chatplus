@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0local-build-portal.ps1" %*
