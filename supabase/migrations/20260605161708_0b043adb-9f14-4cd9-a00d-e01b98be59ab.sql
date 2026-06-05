
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day DATE NOT NULL,
  challenge_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_challenges TO authenticated;
GRANT ALL ON public.daily_challenges TO service_role;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own challenges" ON public.daily_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own challenges" ON public.daily_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own challenges" ON public.daily_challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own challenges" ON public.daily_challenges FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_daily_challenges_updated_at BEFORE UPDATE ON public.daily_challenges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.writing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  words_start INTEGER NOT NULL DEFAULT 0,
  words_end INTEGER NOT NULL DEFAULT 0,
  words_written INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.writing_sessions TO authenticated;
GRANT ALL ON public.writing_sessions TO service_role;
ALTER TABLE public.writing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sessions" ON public.writing_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.writing_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.writing_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.writing_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_writing_sessions_updated_at BEFORE UPDATE ON public.writing_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX writing_sessions_user_started_idx ON public.writing_sessions(user_id, started_at DESC);
