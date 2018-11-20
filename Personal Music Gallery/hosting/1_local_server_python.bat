@ECHO OFF
SET @launch="%CD%"
CD %@launch%
ECHO %@launch%
python SimpleServer.py