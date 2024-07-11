# Copyright 2023 Iguazio
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
from typing import Union

import sqlalchemy
from sqlalchemy.orm import sessionmaker

from controller.src import model
from controller.src.model import ApiResponse

from controller.src.config import config, logger
from controller.src.sqldb import Base, ChatSessionContext, DocumentCollection, User


class SqlClient:
    def __init__(self, db_url: str, verbose: bool = False):
        self.db_url = db_url
        self.engine = sqlalchemy.create_engine(
            db_url, echo=verbose, connect_args={"check_same_thread": False}
        )
        self._session_maker = sessionmaker(bind=self.engine)
        self._local_maker = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )

    def get_db_session(self, session: sqlalchemy.orm.Session = None):
        return session or self._session_maker()

    def get_local_session(self):
        return self._local_maker()

    def create_tables(self, drop_old: bool = False, names: list = None):
        tables = None
        if names:
            tables = [Base.metadata.tables[name] for name in names]
        if drop_old:
            Base.metadata.drop_all(self.engine, tables=tables)
        Base.metadata.create_all(self.engine, tables=tables, checkfirst=True)
        return ApiResponse(success=True)

    def _update(self, session: sqlalchemy.orm.Session, db_class, api_object, **kwargs):
        session = self.get_db_session(session)
        obj = session.query(db_class).filter_by(**kwargs).one_or_none()
        if obj:
            api_object.merge_into_orm_object(obj)
            session.add(obj)
            session.commit()
            return ApiResponse(
                success=True, data=api_object.__class__.from_orm_object(obj)
            )
        else:
            return ApiResponse(
                success=False, error=f"{db_class} object ({kwargs}) not found"
            )

    def _delete(self, session: sqlalchemy.orm.Session, db_class, **kwargs):
        session = self.get_db_session(session)
        query = session.query(db_class).filter_by(**kwargs)
        for obj in query:
            session.delete(obj)
        session.commit()
        return ApiResponse(success=True)

    def _get(self, session: sqlalchemy.orm.Session, db_class, api_class, **kwargs):
        session = self.get_db_session(session)
        obj = session.query(db_class).filter_by(**kwargs).one_or_none()
        if obj is None:
            return ApiResponse(
                success=False, error=f"{db_class} object ({kwargs}) not found"
            )
        return ApiResponse(success=True, data=api_class.from_orm_object(obj))

    def _create(self, session: sqlalchemy.orm.Session, db_class, obj):
        session = self.get_db_session(session)
        try:
            db_object = obj.to_orm_object(db_class)
            session.add(db_object)
            session.commit()
            return ApiResponse(
                success=True, data=obj.__class__.from_orm_object(db_object)
            )
        except sqlalchemy.exc.IntegrityError:
            return ApiResponse(
                success=False, error=f"{db_class} {obj.name} already exists"
            )

    def get_user(self, username: str, session: sqlalchemy.orm.Session = None):
        logger.debug(f"Getting user: username={username}")
        return self._get(session, User, model.User, name=username)

    def create_user(self, user: model.User, session: sqlalchemy.orm.Session = None):
        logger.debug(f"Creating user: {user}")
        user.name = user.name or user.email
        return self._create(session, User, user)

    def update_user(self, user: model.User, session: sqlalchemy.orm.Session = None):
        logger.debug(f"Updating user: {user}")
        return self._update(session, User, user, name=user.name)

    def delete_user(self, username: str, session: sqlalchemy.orm.Session = None):
        logger.debug(f"Deleting user: username={username}")
        return self._delete(session, User, name=username)

    def list_users(
        self,
        email: str = None,
        full_name: str = None,
        labels_match: Union[list, str] = None,
        output_mode: model.OutputMode = model.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ):
        logger.debug(
            f"Getting users: full_name~={full_name}, email={email}, mode={output_mode}"
        )
        session = self.get_db_session(session)
        query = session.query(User)
        if email:
            query = query.filter(User.email == email)
        if full_name:
            query = query.filter(User.full_name.like(f"%{full_name}%"))
        data = _process_output(query.all(), model.User, output_mode)
        return ApiResponse(success=True, data=data)

    def get_collection(self, name: str, session: sqlalchemy.orm.Session = None):
        logger.debug(f"Getting collection: name={name}")
        return self._get(session, DocumentCollection, model.DocCollection, name=name)

    def create_collection(
        self, collection: model.DocCollection, session: sqlalchemy.orm.Session = None
    ):
        logger.debug(f"Creating collection: {collection}")
        collection = model.DocCollection.from_dict(collection)
        return self._create(session, DocumentCollection, collection)

    def update_collection(
        self, collection: model.DocCollection, session: sqlalchemy.orm.Session = None
    ):
        logger.debug(f"Updating collection: {collection}")
        return self._update(
            session, DocumentCollection, collection, name=collection.name
        )

    def delete_collection(self, name: str, session: sqlalchemy.orm.Session = None):
        logger.debug(f"Deleting collection: name={name}")
        return self._delete(session, DocumentCollection, name=name)

    def list_collections(
        self,
        owner: str = None,
        labels_match: Union[list, str] = None,
        output_mode: model.OutputMode = model.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ):
        logger.debug(
            f"Getting collections: owner={owner}, labels_match={labels_match}, mode={output_mode}"
        )
        session = self.get_db_session(session)
        query = session.query(DocumentCollection)
        if owner:
            query = query.filter(DocumentCollection.owner_name == owner)
        if labels_match:
            pass
        data = _process_output(query.all(), model.DocCollection, output_mode)
        return ApiResponse(success=True, data=data)

    def get_session(
        self,
        session_id: str,
        username: str = None,
        session: sqlalchemy.orm.Session = None,
    ):
        logger.debug(
            f"Getting chat session: session_id={session_id}, username={username}"
        )
        if session_id:
            return self._get(
                session, ChatSessionContext, model.ChatSession, name=session_id
            )
        elif username:
            # get the last session for the user
            resp = self.list_sessions(username=username, last=1, session=session)
            if resp.success:
                data = resp.data[0] if resp.data else None
                return ApiResponse(success=True, data=data)
            return resp
        else:
            return ApiResponse(
                success=False, error="session_id or username must be provided"
            )

    def create_session(
        self, chat_session: model.ChatSession, session: sqlalchemy.orm.Session = None
    ):
        logger.debug(f"Creating chat session: {chat_session}")
        return self._create(session, ChatSessionContext, chat_session)

    def update_session(
        self, chat_session: model.ChatSession, session: sqlalchemy.orm.Session = None
    ):
        logger.debug(f"Updating chat session: {chat_session}")
        return self._update(
            session, ChatSessionContext, chat_session, name=chat_session.name
        )

    def delete_session(self, session_id: str, session: sqlalchemy.orm.Session = None):
        logger.debug(f"Deleting chat session: session_id={session_id}")
        return self._delete(session, ChatSessionContext, name=session_id)

    def list_sessions(
        self,
        username: str = None,
        created_after=None,
        last=0,
        output_mode: model.OutputMode = model.OutputMode.Details,
        session: sqlalchemy.orm.Session = None,
    ):
        logger.debug(
            f"Getting chat sessions: username={username}, created>{created_after}, last={last}, mode={output_mode}"
        )
        session = self.get_db_session(session)
        query = session.query(ChatSessionContext)
        if username:
            query = query.filter(ChatSessionContext.username == username)
        if created_after:
            if isinstance(created_after, str):
                created_after = datetime.datetime.strptime(
                    created_after, "%Y-%m-%d %H:%M"
                )
            query = query.filter(ChatSessionContext.created >= created_after)
        query = query.order_by(ChatSessionContext.updated.desc())
        if last > 0:
            query = query.limit(last)
        data = _process_output(query.all(), model.ChatSession, output_mode)
        return ApiResponse(success=True, data=data)


def _dict_to_object(cls, d):
    if isinstance(d, dict):
        return cls.from_dict(d)
    return d


def _process_output(
    items, obj_class, mode: model.OutputMode = model.OutputMode.Details
):
    if mode == model.OutputMode.Names:
        return [item.name for item in items]
    items = [obj_class.from_orm_object(item) for item in items]
    if mode == model.OutputMode.Details:
        return items
    short = mode == model.OutputMode.Short
    return [item.to_dict(short=short) for item in items]


client = SqlClient(config.sql_connection_str, verbose=config.verbose)
