import { Response } from 'express';

const clients = new Set<Response>();

export function addClient(res: Response) {
  clients.add(res);
}

export function removeClient(res: Response) {
  clients.delete(res);
}

export function broadcast(event: string, data: any) {
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  for (const res of Array.from(clients)) {
    try {
      res.write(payload);
    } catch (e) {
      // ignore write errors
    }
  }
}

export function clientCount() { return clients.size; }
