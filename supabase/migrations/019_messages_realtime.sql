-- Allow clients to receive new chat messages while a thread is open
alter publication supabase_realtime add table messages;
