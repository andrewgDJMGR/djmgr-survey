require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'djmgr-admin';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'responses.json');

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readAll() {
  try { ensureData(); return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function addRecord(record) {
  const records = readAll();
  records.push(record);
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function adminAuth(req, res, next) {
  if (req.headers['x-admin-password'] !== ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/submit', (req, res) => {
  try {
    const d = req.body;
    addRecord({ id: uuidv4(), dj_name: d.djName||'', age: parseInt(d.age)||null,
      country: d.country||'', mgmt_status: d.managementStatus||'',
      market_reach: d.marketReach||'', data: d,
      submitted_at: new Date().toISOString() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to save' }); }
});

app.get('/api/stats', adminAuth, (req, res) => {
  try {
    const records = readAll();
    const FEE_ORDER = ['Under €500','€500-€1,500','€1,500-€3,000','€3,000-€7,500','€7,500-€15,000','€15,000-€30,000','Over €30,000'];
    const FEATURES = [
      {key:'soundMastery',label:'Sound mastery'},{key:'gettingBooked',label:'Getting booked'},
      {key:'raisingFees',label:'Raising fees'},{key:'contentSocial',label:'Content & social'},
      {key:'adminLogistics',label:'Admin & logistics'},{key:'brandBio',label:'Brand & bio'}
    ];
    const cnt = (arr) => arr.reduce((acc,v)=>{ if(v!=null&&v!=='') acc[v]=(acc[v]||0)+1; return acc; },{});
    const satVals = records.map(r=>parseInt(r.data.mgr_satisfaction)).filter(n=>!isNaN(n)&&n>0);
    res.json({
      stats: {
        total: records.length,
        managementStatus: cnt(records.map(r=>r.mgmt_status)),
        marketReach: cnt(records.map(r=>r.market_reach)),
        followUpWho: cnt(records.map(r=>r.data.followUpWho)),
        lostFromNoFollowup: cnt(records.map(r=>r.data.lostFromNoFollowup)),
        soundClarity: cnt(records.map(r=>r.data.soundClarity)),
        trackAnalysis: cnt(records.map(r=>r.data.trackAnalysis)),
        postFreq: cnt(records.map(r=>r.data.postFreq)),
        autoPostTrust: cnt(records.map(r=>r.data.autoPostTrust)),
        rateDataChange: cnt(records.map(r=>r.data.rateDataChange)),
        whoPays: cnt(records.map(r=>r.data.whoPays)),
        monthlyVal: cnt(records.map(r=>r.data.monthlyVal)),
        killerCat: cnt(records.map(r=>r.data.killerCat)),
        feeDistribution: FEE_ORDER.map(label=>({ label, count: records.filter(r=>r.data.currentFee===label).length })),
        featureRanking: FEATURES.map(f=>{
          const vals = records.map(r=>parseInt(r.data.featureRanking?.[f.key])).filter(n=>!isNaN(n)&&n>0);
          return { label:f.label, avg: vals.length ? parseFloat((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)) : 0, count:vals.length };
        }).sort((a,b)=>a.avg-b.avg),
        avgMgrSatisfaction: satVals.length ? parseFloat((satVals.reduce((a,b)=>a+b,0)/satVals.length).toFixed(1)) : null,
      },
      responses: records
    });
  } catch (err) { res.status(500).json({ error: 'Failed to load stats' }); }
});

app.get('/api/export', adminAuth, (req, res) => {
  const records = readAll();
  const cols = ['id','dj_name','age','country','mgmt_status','market_reach','submitted_at'];
  const csv = [cols.join(','), ...records.map(r=>cols.map(c=>JSON.stringify(r[c]??'')).join(','))].join('\n');
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename="djmgr-responses.csv"');
  res.send(csv);
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname,'public','admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname,'public','survey.html')));

app.listen(PORT, () => {
  console.log(`DJMGR Survey: http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin  |  Password: ${ADMIN_PASSWORD}`);
});
