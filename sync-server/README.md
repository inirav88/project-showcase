# ShowcaseOS VPS Sync Server

Standalone Cloud Sync backend server for `showcase.salesstudio.in`.

## Quick Start on VPS Server

### 1. Upload files to your VPS
Upload the contents of `sync-server/` to your VPS directory (e.g. `/var/www/showcase-sync/`).

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
```bash
cp .env.example .env
```
Edit `.env` and set your desired `API_KEY`:
```env
PORT=3000
API_KEY=your-secure-secret-key-here
```

### 4. Start with PM2
```bash
npm install -g pm2
pm2 start index.js --name "showcase-sync"
pm2 save
```

### 5. Nginx Reverse Proxy Setup (for HTTPS on `showcase.salesstudio.in`)
Add Nginx site block:
```nginx
server {
    server_name showcase.salesstudio.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 100M;
    }
}
```

Enable SSL using Certbot:
```bash
sudo certbot --nginx -d showcase.salesstudio.in
```

### 6. Fill in ShowcaseOS Admin Settings
- **VPS Server Base URL:** `https://showcase.salesstudio.in`
- **VPS API Secret Key:** `your-secure-secret-key-here` (matching your `.env`)
