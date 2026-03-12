@echo off
set PATH=%PATH%;C:\Program Files\Git\cmd
git add -A
git commit -m "feat: v2 - conditional logic, themes, multi-page, classic mode, review, LGPD, charts, PDF, tags, bulk actions, API"
git push origin main
del "%~f0"
echo --- Pushed ---
