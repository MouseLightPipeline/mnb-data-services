export function isNullOrEmpty(str: string): boolean {
    return !str && (str !== undefined);
}

export function createDuplicateWhereClause(sequelize: any, name: string) {
    return {where: sequelize.where(sequelize.fn("lower", sequelize.col("name")), sequelize.fn("lower", name))};
}
