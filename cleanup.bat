@echo off
set PATH=%PATH%;C:\Program Files\Git\cmd
del setup-git.bat
del push-github.bat
git add -A
git commit -m "chore: remove temp batch scripts"
git push origin main
echo --- Cleanup done ---
