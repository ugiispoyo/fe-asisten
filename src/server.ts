import express from 'express';
import cors from 'cors';

/* router */
import chatRouter from './routes/chat';
import feedbackRouter from './routes/feedback';
import sliceFromImageRouter from './routes/sliceFromImage';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/chat', chatRouter);
app.use('/feedback', feedbackRouter);
app.use('/slice-from-image', sliceFromImageRouter);

const PORT = process.env.PORT ?? 4217;

app.listen(PORT, () => {
  console.log(`Assistant API listening on http://localhost:${PORT}`);
});
