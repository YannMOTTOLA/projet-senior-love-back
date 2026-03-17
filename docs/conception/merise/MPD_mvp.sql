-- ===========================================
-- MPD - Modèle Physique de Données (PostgreSQL)
-- ===========================================

-- ===========================================
-- Création des types ENUM
-- ===========================================

CREATE TYPE gender_enum AS ENUM ('homme', 'femme', 'non-bianire', 'autre');

CREATE TYPE visibility_member_enum AS ENUM ('ONLINE');

CREATE TYPE relation_type_enum AS ENUM ('amicale', 'amoureuse', 'les_deux');

CREATE TYPE visibility_event_enum AS ENUM ('public', 'prive');

CREATE TYPE status_event_enum AS ENUM ('publie', 'complet', 'clos');

-- ===========================================
-- Table Role
-- ===========================================

CREATE TABLE Role (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ===========================================
-- Table User
-- ===========================================

CREATE TABLE "User" (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role_id UUID NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    profile_picture TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    bio TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES Role(id)
);

-- ===========================================
-- Table Member
-- ===========================================

CREATE TABLE Member (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    gender gender_enum NOT NULL,
    phone_number INT UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    show_age BOOLEAN DEFAULT true,
    visibility visibility_member_enum DEFAULT 'ONLINE',
    relation_type relation_type_enum NOT NULL,
    age_min INT NOT NULL,
    age_max INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP,
    CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES "User"(id),
    CONSTRAINT check_age_max CHECK (age_max >= age_min)
);

-- ===========================================
-- Table Organization
-- ===========================================

CREATE TABLE Organization (
    id UUID PRIMARY KEY,
    siret TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP,
    CONSTRAINT fk_organization_user FOREIGN KEY (user_id) REFERENCES "User"(id)
);

-- ===========================================
-- Table Interest
-- ===========================================

CREATE TABLE Interest (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- ===========================================
-- Table UserInterest (N-N User <-> Interest)
-- ===========================================

CREATE TABLE UserInterest (
    user_id UUID NOT NULL,
    interest_id UUID NOT NULL,
    PRIMARY KEY (user_id, interest_id),
    CONSTRAINT fk_userinterest_user FOREIGN KEY (user_id) REFERENCES "User"(id),
    CONSTRAINT fk_userinterest_interest FOREIGN KEY (interest_id) REFERENCES Interest(id)
);

-- ===========================================
-- Table Event
-- ===========================================

CREATE TABLE Event (
    id UUID PRIMARY KEY,
    organizer_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    visibility visibility_event_enum NOT NULL DEFAULT 'public',
    max_participants INTEGER NOT NULL,
    illustration_url TEXT,
    status status_event_enum NOT NULL DEFAULT 'publie',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP,
    CONSTRAINT fk_event_organizer FOREIGN KEY (organizer_id) REFERENCES "User"(id),
    CONSTRAINT check_max_participants CHECK (max_participants >= 1 AND max_participants <= 1500)
);

-- ===========================================
-- Table EventInterest (N-N Event <-> Interest)
-- ===========================================

CREATE TABLE EventInterest (
    event_id UUID NOT NULL,
    interest_id UUID NOT NULL,
    PRIMARY KEY (event_id, interest_id),
    CONSTRAINT fk_eventinterest_event FOREIGN KEY (event_id) REFERENCES Event(id),
    CONSTRAINT fk_eventinterest_interest FOREIGN KEY (interest_id) REFERENCES Interest(id)
);

-- ===========================================
-- Table UserParticipationEvent (N-N User <-> Event)
-- ===========================================

CREATE TABLE UserParticipationEvent (
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (event_id, user_id),
    CONSTRAINT fk_participation_event FOREIGN KEY (event_id) REFERENCES Event(id),
    CONSTRAINT fk_participation_user FOREIGN KEY (user_id) REFERENCES "User"(id)
);

-- ===========================================
-- Table Message
-- ===========================================

CREATE TABLE Message (
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP,
    PRIMARY KEY (sender_id, receiver_id),
    CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES "User"(id),
    CONSTRAINT fk_message_receiver FOREIGN KEY (receiver_id) REFERENCES "User"(id)
);