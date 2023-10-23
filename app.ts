import express from 'express';
import registerRoutes from './src/utils/registerRoutes';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors())

registerRoutes(app, `${__dirname}/src/routes`);

app.listen(port, () => {
return console.log(`Express server is listening at http://localhost:${port} 🚀`);
});
