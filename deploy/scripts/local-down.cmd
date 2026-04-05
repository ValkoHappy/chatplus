@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0local-down.ps1" %*
