export NVM_DIR=~/.nvm
source ~/.nvm/nvm.sh
nvm use 14.0.0
npm install
npm run delete:prd
npm run start:prd
pm2 save