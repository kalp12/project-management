import graphene
from .queries import Query as CoreQuery
from .mutations import Mutation as CoreMutation

class Query(CoreQuery, graphene.ObjectType):
    pass

class Mutation(CoreMutation, graphene.ObjectType):
    pass
