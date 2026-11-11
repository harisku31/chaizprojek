@echo off
title ChaizStore Dedicated Backend Server
echo ======================================================
echo    CHAIZSTORE REALTIME BACKEND SERVER (Port 3005)
echo    Express + Socket.io + SQLite WAL Engine
echo ======================================================
echo.
echo Starting server...
node server/index.js
pause
