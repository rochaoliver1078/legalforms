@echo off
set PATH=%PATH%;C:\Program Files\Git\cmd
echo --- Git Version ---
git --version
echo --- Init Repo ---
git init
echo --- Add All ---
git add -A
echo --- Commit ---
git config user.email "rocha@legalforms.app"
git config user.name "rocha"
git commit -m "feat: LegalForms app completo - builder, fill mode, responses, sharing"
echo --- Status ---
git status
echo --- Done ---
