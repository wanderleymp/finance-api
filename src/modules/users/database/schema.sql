-- Table: public.users
CREATE TABLE IF NOT EXISTS public.users
(
    user_id integer NOT NULL DEFAULT nextval('user_accounts_user_id_seq'::regclass),
    username character varying(50) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    person_id integer NOT NULL,
    enable_2fa boolean DEFAULT false,
    two_factor_secret text COLLATE pg_catalog."default",
    two_factor_secret_temp text COLLATE pg_catalog."default",
    refresh_token text COLLATE pg_catalog."default",
    failed_login_attempts integer DEFAULT 0,
    last_failed_attempt timestamp with time zone,
    account_locked_until timestamp with time zone,
    password_changed_at timestamp with time zone,
    password_expires_at timestamp with time zone,
    require_password_change boolean DEFAULT false,
    profile_id integer,
    last_login timestamp without time zone,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_accounts_pkey PRIMARY KEY (user_id),
    CONSTRAINT unique_person_user UNIQUE (person_id),
    CONSTRAINT fk_user_profile FOREIGN KEY (profile_id)
        REFERENCES public.profiles (profile_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT user_accounts_person_id_fkey FOREIGN KEY (person_id)
        REFERENCES public.persons (person_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT users_person_id_fkey FOREIGN KEY (person_id)
        REFERENCES public.persons (person_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

-- Index for refresh token
CREATE INDEX IF NOT EXISTS idx_users_refresh_token
    ON public.users USING btree
    (refresh_token COLLATE pg_catalog."default" ASC NULLS LAST);
