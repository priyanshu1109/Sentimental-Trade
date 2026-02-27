import React, { useState, useEffect, useMemo } from 'react';
import { 
  ThemeProvider, createTheme, CssBaseline, Box, Container, Grid, Typography, TextField, Button, 
  CircularProgress, Alert, Chip, Divider, List, ListItem, ListItemText, Paper, Stack, IconButton,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ButtonGroup
} from '@mui/material';
import { 
  Search as SearchIcon, TrendingUp, TrendingDown, Dashboard, Assessment, Public, Info as InfoIcon,
  SentimentSatisfiedAlt, Launch, CalendarMonth, BarChart, History as HistoryIcon, Layers,
  ReceiptLong, AccountBalance, Payments, WarningAmber
} from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const darkTheme = createTheme({
  palette: { mode: 'dark', primary: { main: '#10b981' }, background: { default: '#0a0a0b', paper: '#121214' }, divider: '#27272a' },
  typography: { fontFamily: '"Inter", sans-serif', h4: { fontWeight: 800 }, h5: { fontWeight: 700 } },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', borderRadius: 12, border: '1px solid #27272a' } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 } } },
  },
});

const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [marketSummary, setMarketSummary] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [financialSubTab, setFinancialSubTab] = useState('income_statement');

  useEffect(() => {
    const fetchMarketData = async () => {
      try { const response = await axios.get(`${API_BASE_URL}/market-summary`); setMarketSummary(response.data); } catch (err) { console.error(err); }
    };
    fetchMarketData();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (ticker.length < 2) { setSuggestions([]); return; }
      try { const response = await axios.get(`${API_BASE_URL}/search?q=${ticker}`); setSuggestions(response.data); } catch (err) { console.error(err); }
    };
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [ticker]);

  const handleSearch = async (e?: React.FormEvent, selectedTicker?: string) => {
    if (e) e.preventDefault();
    const searchTicker = selectedTicker || ticker;
    if (!searchTicker.trim()) return;
    setLoading(true); setError(null); setShowSuggestions(false);
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/${searchTicker.toUpperCase()}`);
      setData(response.data); setTicker(searchTicker.toUpperCase());
    } catch (err: any) { setError(err.response?.data?.detail || "An error occurred during analysis."); }
    finally { setLoading(false); }
  };

  const chartData = useMemo(() => {
    if (!data?.stock_data.chart_data) return [];
    return data.stock_data.chart_data.map((p: any) => ({
      ...p, Date: new Date(p.Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
  }, [data]);

  const getRecColor = (color: string) => {
    if (color === 'green') return '#10b981';
    if (color === 'red') return '#f43f5e';
    return '#f59e0b';
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Box sx={{ width: 80, bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider', display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'center', py: 4, gap: 4 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 2, mb: 4 }}><Assessment sx={{ color: 'white' }} /></Box>
          <Stack spacing={4} sx={{ color: 'text.secondary' }}><Dashboard color="primary" /><Public /><InfoIcon /></Stack>
        </Box>

        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 6 } }}>
          <Container maxWidth="lg">
            <Box sx={{ mb: 6, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 3 }}>
              <Box>
                <Typography variant="h4" sx={{ letterSpacing: '-0.02em' }}>AI <Box component="span" sx={{ color: 'primary.main' }}>STOCKS</Box></Typography>
                <Typography variant="body2" color="text.secondary">Sentiment Signals and Their Impact on Market Movements</Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                {marketSummary.map((idx: any, i: number) => (
                  <Paper key={i} sx={{ p: 1.5, minWidth: 100 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block' }}>{idx.symbol}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{idx.price}</Typography>
                      <Typography variant="caption" sx={{ color: idx.change_pct >= 0 ? 'success.main' : 'error.main', display: 'flex', alignItems: 'center', fontWeight: 700 }}>
                        {idx.change_pct >= 0 ? <TrendingUp fontSize="inherit" /> : <TrendingDown fontSize="inherit" />} {Math.abs(idx.change_pct)?.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Box sx={{ position: 'relative', mb: 6 }}>
              <Paper component="form" onSubmit={handleSearch} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, zIndex: 10, position: 'relative' }}>
                <Box sx={{ px: 2, color: 'text.secondary' }}><SearchIcon /></Box>
                <TextField fullWidth placeholder="Search company or ticker..." variant="standard" value={ticker} onChange={(e) => { setTicker(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} disabled={loading} InputProps={{ disableUnderline: true, sx: { fontSize: '1.1rem' } }} />
                <Button variant="contained" type="submit" disabled={loading || !ticker.trim()} sx={{ px: 4, py: 1.2 }}>{loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze'}</Button>
              </Paper>
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: '8px' }}>
                    <Paper sx={{ maxHeight: 300, overflowY: 'auto', p: 1 }}>
                      <List disablePadding>
                        {suggestions.map((item, i) => (
                          <ListItem key={i} button onClick={() => handleSearch(undefined, item.symbol)} sx={{ borderRadius: 1.5, mb: 0.5 }}>
                            <ListItemText primary={<Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{item.symbol}</Typography><Typography variant="caption">{item.exchange}</Typography></Box>} secondary={item.name} />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </motion.div>
                )}
              </AnimatePresence>
              {showSuggestions && <Box onClick={() => setShowSuggestions(false)} sx={{ position: 'fixed', inset: 0, zIndex: 5 }} />}
            </Box>

            {error && <Alert severity="error" variant="outlined" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>}

            <AnimatePresence mode="wait">
              {loading ? (
                <Box sx={{ py: 20, textAlign: 'center' }}><CircularProgress size={60} thickness={4} /><Typography variant="h6" color="text.secondary" sx={{ mt: 3 }}>Analyzing Market Data...</Typography></Box>
              ) : data ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <Stack spacing={4}>
                    <Paper sx={{ p: 0, overflow: 'hidden' }}>
                      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} textColor="primary" indicatorColor="primary">
                          <Tab label="Overview" icon={<Layers />} iconPosition="start" />
                          <Tab label="Financials" icon={<BarChart />} iconPosition="start" />
                          <Tab label="Earnings" icon={<CalendarMonth />} iconPosition="start" />
                          <Tab label="Historical" icon={<HistoryIcon />} iconPosition="start" />
                        </Tabs>
                        <Box sx={{ textAlign: 'right', py: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>
                            {data.stock_data.currency_symbol}{data.stock_data.current_price.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 800 }}>{data.stock_data.ticker}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ p: 4 }}>
                        {activeTab === 0 && (
                          <Box>
                            <Typography variant="h5" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}><span style={{ fontSize: '1.4em' }}>{data.stock_data.flag}</span> {data.stock_data.company_name}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{data.stock_data.sector} • {data.stock_data.industry}</Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>{data.stock_data.description}</Typography>
                          </Box>
                        )}
                        {activeTab === 1 && (
                          <Box>
                            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                              <ButtonGroup variant="outlined" color="primary">
                                <Button variant={financialSubTab === 'income_statement' ? 'contained' : 'outlined'} onClick={() => setFinancialSubTab('income_statement')} startIcon={<ReceiptLong />}>Income</Button>
                                <Button variant={financialSubTab === 'balance_sheet' ? 'contained' : 'outlined'} onClick={() => setFinancialSubTab('balance_sheet')} startIcon={<AccountBalance />}>Balance</Button>
                                <Button variant={financialSubTab === 'cash_flow' ? 'contained' : 'outlined'} onClick={() => setFinancialSubTab('cash_flow')} startIcon={<Payments />}>Cash Flow</Button>
                              </ButtonGroup>
                            </Box>
                            <TableContainer sx={{ maxHeight: 500 }}>
                              <Table size="small" stickyHeader>
                                <TableHead><TableRow><TableCell sx={{ fontWeight: 800 }}>Metric</TableCell>{Object.keys(data.stock_data.financials[financialSubTab][0] || {}).filter(k => k !== 'metric').sort().reverse().map(y => <TableCell key={y} sx={{ textAlign: 'right', fontWeight: 800 }}>{y}</TableCell>)}</TableRow></TableHead>
                                <TableBody>{data.stock_data.financials[financialSubTab].map((row: any, i: number) => (<TableRow key={i}><TableCell sx={{ fontWeight: 600 }}>{row.metric}</TableCell>{Object.keys(row).filter(k => k !== 'metric').sort().reverse().map(y => <TableCell key={y} sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{row[y]}</TableCell>)}</TableRow>))}</TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}
                        {activeTab === 2 && (
                          <Box>
                            <Typography variant="h6" sx={{ mb: 3 }}>Earnings History</Typography>
                            <TableContainer><Table size="small"><TableHead><TableRow><TableCell sx={{ fontWeight: 800 }}>Date</TableCell><TableCell sx={{ fontWeight: 800 }}>Type</TableCell><TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>EPS Actual</TableCell></TableRow></TableHead>
                            <TableBody>{data.stock_data.earnings.map((e: any, i: number) => (<TableRow key={i}><TableCell>{e.Date}</TableCell><TableCell><Chip label={e.Type} size="small" variant="outlined" /></TableCell><TableCell sx={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>{e['EPS Actual'] !== 'N/A' ? `${data.stock_data.currency_symbol}${e['EPS Actual']}` : 'N/A'}</TableCell></TableRow>))}</TableBody>
                            </Table></TableContainer>
                          </Box>
                        )}
                        {activeTab === 3 && (
                          <TableContainer sx={{ maxHeight: 400 }}><Table size="small" stickyHeader><TableHead><TableRow><TableCell sx={{ fontWeight: 800 }}>Date</TableCell><TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Close</TableCell></TableRow></TableHead>
                          <TableBody>{data.stock_data.chart_data.slice().reverse().slice(0, 30).map((h: any, i: number) => (<TableRow key={i}><TableCell>{h.Date}</TableCell><TableCell sx={{ textAlign: 'right' }}>{data.stock_data.currency_symbol}{h.Close?.toFixed(2)}</TableCell></TableRow>))}</TableBody>
                          </Table></TableContainer>
                        )}
                      </Box>
                    </Paper>

                    <Paper sx={{ p: 4, height: 450 }}>
                      <Box sx={{ height: 380 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis dataKey="Date" stroke="#71717a" fontSize={11} axisLine={false} />
                            <YAxis stroke="#71717a" fontSize={11} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${data.stock_data.currency_symbol}${v}`} />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }} formatter={(v: number) => [`${data.stock_data.currency_symbol}${v?.toFixed(2)}`, 'Price']} />
                            <Area type="monotone" dataKey="Close" stroke="#10b981" fill="url(#colorPrice)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    </Paper>

                    <Paper sx={{ p: 4 }}>
                      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}><WarningAmber sx={{ color: 'warning.main' }} /> Notable Price Movements</Typography>
                      <TableContainer><Table size="small"><TableHead><TableRow><TableCell sx={{ fontWeight: 800 }}>Date</TableCell><TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Price</TableCell><TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>% Change</TableCell><TableCell sx={{ fontWeight: 800 }}>Possible Reason</TableCell></TableRow></TableHead>
                      <TableBody>{data.stock_data.notable_movements?.map((m: any, i: number) => (<TableRow key={i}><TableCell sx={{ fontWeight: 600 }}>{m.Date}</TableCell><TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>{data.stock_data.currency_symbol}{m.Close.toFixed(2)}</TableCell><TableCell sx={{ textAlign: 'right', color: m.Pct_Change > 0 ? 'success.main' : 'error.main', fontWeight: 900 }}>{m.Pct_Change > 0 ? '+' : ''}{m.Pct_Change?.toFixed(2)}%</TableCell><TableCell sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.85rem' }}>{m.Reason}</TableCell></TableRow>))}</TableBody>
                      </Table></TableContainer>
                    </Paper>

                    <Grid container spacing={4}>
                      <Grid item xs={12} md={3}>
                        <Stack spacing={2}>
                          {[
                            { label: 'RSI', val: data.stock_data.indicators.rsi?.toFixed(2), stat: data.stock_data.indicators.rsi > 70 ? 'Overbought' : data.stock_data.indicators.rsi < 30 ? 'Oversold' : 'Neutral' },
                            { label: 'SMA 50', val: `${data.stock_data.currency_symbol}${data.stock_data.indicators.sma_50?.toFixed(2)}`, stat: 'Mid-term' },
                            { label: 'SMA 200', val: `${data.stock_data.currency_symbol}${data.stock_data.indicators.sma_200?.toFixed(2)}`, stat: 'Long-term' },
                            { label: 'MACD', val: data.stock_data.indicators.macd?.toFixed(2), stat: data.stock_data.indicators.macd > data.stock_data.indicators.macd_signal ? 'Bullish' : 'Bearish' }
                          ].map((item, i) => (
                            <Paper key={i} sx={{ p: 2.5, textAlign: 'center' }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>{item.label}</Typography>
                              <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{item.val}</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 900, color: (item.stat.includes('Bullish') || item.stat === 'Oversold') ? 'success.main' : (item.stat.includes('Bearish') || item.stat === 'Overbought') ? 'error.main' : 'text.secondary' }}>{item.stat}</Typography>
                            </Paper>
                          ))}
                        </Stack>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 4, height: '100%', border: '2px solid', borderColor: getRecColor(data.recommendation.color) }}>
                          <Typography variant="h6" sx={{ mb: 3 }}><SentimentSatisfiedAlt sx={{ color: getRecColor(data.recommendation.color) }} /> Recommendation</Typography>
                          <Box sx={{ textAlign: 'center', py: 4, bgcolor: `${getRecColor(data.recommendation.color)}10`, borderRadius: 4, mb: 4 }}><Typography variant="h2" sx={{ fontWeight: 950, color: getRecColor(data.recommendation.color) }}>{data.recommendation.recommendation}</Typography></Box>
                          <Stack spacing={2}>{data.recommendation.reasons.slice(0, 3).map((r: string, i: number) => (<Box key={i} sx={{ display: 'flex', gap: 2 }}><Box sx={{ mt: 1, width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} /><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{r}</Typography></Box>))}</Stack>
                        </Paper>
                      </Grid>

                      <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 4, height: '100%' }}>
                          <Typography variant="h6" sx={{ mb: 4 }}><Public sx={{ color: 'primary.main' }} /> Sentiment Analysis</Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
                            <Box sx={{ textAlign: 'center' }}><Typography variant="h3">{(data.sentiment_data.overall_sentiment_score * 100)?.toFixed(0)}%</Typography><Typography variant="caption" color="text.secondary">Score</Typography></Box>
                            <Box sx={{ textAlign: 'center' }}><Typography variant="h3">{data.sentiment_data.num_posts_analyzed}</Typography><Typography variant="caption" color="text.secondary">Mentions</Typography></Box>
                          </Box>
                          <Stack spacing={1.5} sx={{ mb: 4 }}><Box sx={{ height: 16, borderRadius: 8, bgcolor: 'divider', overflow: 'hidden', display: 'flex' }}><Box sx={{ bgcolor: 'success.main', width: `${data.sentiment_data.bullish_pct}%` }} /><Box sx={{ bgcolor: 'error.main', width: `${data.sentiment_data.bearish_pct}%` }} /></Box></Stack>
                          <Divider sx={{ mb: 3 }} />
                          <List disablePadding>{data.sentiment_data.top_posts.slice(0, 2).map((p: any, i: number) => (<ListItem key={i} disableGutters sx={{ mb: 1.5, flexDirection: 'column', alignItems: 'flex-start' }} secondaryAction={<IconButton size="small" component="a" href={p.url} target="_blank"><Launch fontSize="inherit" /></IconButton>}><Typography variant="body2" sx={{ fontWeight: 600, pr: 5 }} className="line-clamp-1">{p.title}</Typography><Typography variant="caption" color="text.secondary">Score: {p.score} | Sent: {p.sentiment?.toFixed(2)}</Typography></ListItem>))}</List>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Stack>
                </motion.div>
              ) : (
                <Box sx={{ py: 20, textAlign: 'center', opacity: 0.3 }}><Dashboard sx={{ fontSize: 100, mb: 2 }} /><Typography variant="h5">Sentiment Signals and Their Impact on Market Movements</Typography></Box>
              )}
            </AnimatePresence>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
