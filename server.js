import Express from './express.js'


const app = Express();
const PORT = '3000'

app.use((req, res, next) => {
    console.log('Middleware');
    req.username = 'middleware1'
    next();
});

app.get('/', (req, res) => {
    res.statusCode = 200;
    res.sendFile('./test.html');
  });
  

app.post('/', (req, res) => {
    const user = req.body;
    const query = req.query;
    console.log(query);
    console.log(user);
    res.setHeader('Content-Type', 'application/json');
    res.status(202)
    res.json(user)
});

app.put('/', (req, res)=>{
    const user = req.body;
    res.status(202)
    res.json(user)
})

app.put('/users/:id', (req, res)=>{
    const id = req.params;
    res.status(203)
    res.json(id)
})

app.delete('/post/:id', (req, res)=>{
    const id = req.params;
    const query = req.query;
    console.log(query);
    console.log(id);
    res.status(204)
    res.end()
})

app.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}`);
})

