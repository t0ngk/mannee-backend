import express from 'express';
import authRouter from './src/routes/auth';
import billRouter from './src/routes/bill';
import friendRouter from './src/routes/friend';
import subscriptionRouter from './src/routes/subscription';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors())

app.use('/auth', authRouter);
app.use('/bill', billRouter);
app.use('/friend', friendRouter);
app.use('/subscription', subscriptionRouter);


app.listen(port, () => {
return console.log(`Express server is listening at http://localhost:${port} 🚀`);
});
