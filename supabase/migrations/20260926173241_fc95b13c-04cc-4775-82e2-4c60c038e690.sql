DROP POLICY IF EXISTS "copilot chats owner select" ON storage.objects;
DROP POLICY IF EXISTS "copilot chats owner insert" ON storage.objects;
DROP POLICY IF EXISTS "copilot chats owner update" ON storage.objects;
DROP POLICY IF EXISTS "copilot chats owner delete" ON storage.objects;
CREATE POLICY "copilot chats owner select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'copilot-chats' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "copilot chats owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'copilot-chats' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "copilot chats owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'copilot-chats' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'copilot-chats' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "copilot chats owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'copilot-chats' AND (storage.foldername(name))[1] = auth.uid()::text);