const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Our simple in-memory database
const tokens = [
    {
        token: "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzZWEtYXJ0IiwiYXVkIjpbImxvZ2luIl0sImV4cCI6MTczOTc0NzYyMCwiaWF0IjoxNzM0NTYzNjIwLCJqdGkiOiI1ODk0Mzk0Mjk0MzU4NTI4NSIsInBheWxvYWQiOnsiaWQiOiI0YzBlOTE5ZmNjMzY4ZGRjMDNmMzQ5MmM2MGRhMmQ0ZCIsImVtYWlsIjoiOXNxcnQ5QGdtYWlsLmNvbSIsImNyZWF0ZV9hdCI6MTczNDU2MTY0MDg5NiwidG9rZW5fc3RhdHVzIjowLCJzdGF0dXMiOjEsImlzcyI6IiJ9fQ.qHn5ig9PuWlFYyY-pcmQYz4ciVv-Pl0mJDzTM0uqCyWDZd04qkm7iw39GdmF-q5AjRzaoqs0UL6U7dbgGpF8PLzXokQvX44jIJ5Mg38w8FxC15TeDvfKYj3V1O_l6kNKtG7snXu799Bja3EkUyI8ea_sJIQc5oGeJPkUuEvKfIP8lreA6Ljm31xDhNL-Nor2qQvjfPKwzPAfkBbYwrILLSF7-RMlp49xdwA63Eazp1yvBuwFiYjPvUviufH44lbhEA3oHVmJd_ah7IssFueknYP221KgS8_aV3Cq7TaLTxDwIYNyUkZMLdDtMl7PMwvCqTjVDsqYhli_uYV1wDI8dA",
        inUse: false
    },
    {
        token: "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzZWEtYXJ0IiwiYXVkIjpbImxvZ2luIl0sImV4cCI6MTczOTc0NTcwOSwiaWF0IjoxNzM0NTYxNzA5LCJqdGkiOiI1ODk0MTkzOTYxNTAxMTg0NSIsInBheWxvYWQiOnsiaWQiOiIwYzdiYWRmYzZiMmFhMGNiNDVjYzZlNGRmMjI0YzJkOSIsImVtYWlsIjoiZXZvY2hrYTU1OUBnbWFpbC5jb20iLCJjcmVhdGVfYXQiOjE3MzQ1NjE3MDc5NzgsInRva2VuX3N0YXR1cyI6MCwic3RhdHVzIjoxLCJpc3MiOiIifX0.AI9vVAPQ0-5VPSbQJqsVifKQvTYDrpYOd5NDcvK52ofMVeu8sP3_dAsXuPIQ8R67CcnLXhb_FykRh9BbpVQ5bjsEFdCf4AEXEOczQamn8cjNOHhrarOALabZdzj-5siZLLtb08hv6lSLXVDs0qpZjZ_nqaofcLm2_Vc59BsrVIpEdu_kJdJ-La558TsakB_JSnCxRlfxrD_eTIENGgQO9GdR1J7ibcIAZDtEsicBrPzRL-P_AleWujB8tGwB-tkSmEPKf50R8lUkqWOzDygYNeUf1u0LY576RsAre6ZaQy_xn_4SQmULiAid2FfdSF1Mewwc0vNdW2SNDMJkXP0tYQ",
        inUse: false
    }
];

// Root route
app.get('/', (req, res) => {
    console.log('Homepage accessed');
    res.json({
        status: 'running',
        endpoints: {
            'GET /token': 'Get a free token',
            'POST /release': 'Release a token',
            'GET /status': 'Check tokens status'
        }
    });
});

// Get a free token
app.get('/token', (req, res) => {
    const freeToken = tokens.find(t => !t.inUse);
    if (freeToken) {
        freeToken.inUse = true;
        console.log('\n=== Token Acquired ===');
        console.log('Token status:');
        tokens.forEach((t, i) => {
            console.log(`Token ${i + 1}: ${t.inUse ? 'IN USE' : 'FREE'}`);
        });
        console.log('==================\n');
        res.json({ token: freeToken.token });
    } else {
        console.log('\n!!! All tokens are in use !!!\n');
        res.status(503).json({ error: 'No tokens available' });
    }
});

// Check tokens status
app.get('/status', (req, res) => {
    console.log('\n=== Status Check ===');
    console.log('Total tokens:', tokens.length);
    console.log('In use:', tokens.filter(t => t.inUse).length);
    console.log('Available:', tokens.filter(t => !t.inUse).length);
    tokens.forEach((t, i) => {
        console.log(`Token ${i + 1}: ${t.inUse ? 'IN USE' : 'FREE'}`);
    });
    console.log('=================\n');
    
    res.json({
        total: tokens.length,
        inUse: tokens.filter(t => t.inUse).length,
        available: tokens.filter(t => !t.inUse).length,
        tokens: tokens.map(t => ({ inUse: t.inUse }))
    });
});

// Release a token
app.post('/release', (req, res) => {
    const { token } = req.body;
    const tokenObj = tokens.find(t => t.token === token);
    if (tokenObj) {
        tokenObj.inUse = false;
        console.log('\n=== Token Released ===');
        console.log('Token status:');
        tokens.forEach((t, i) => {
            console.log(`Token ${i + 1}: ${t.inUse ? 'IN USE' : 'FREE'}`);
        });
        console.log('===================\n');
        res.json({ success: true });
    } else {
        console.log('\n!!! Token not found for release !!!\n');
        res.status(404).json({ error: 'Token not found' });
    }
});

app.listen(port, () => {
    console.log(`\n=== Token Server Started ===`);
    console.log(`Server running on port ${port}`);
    console.log('Initial token status:');
    tokens.forEach((t, i) => {
        console.log(`Token ${i + 1}: ${t.inUse ? 'IN USE' : 'FREE'}`);
    });
    console.log('=======================\n');
});