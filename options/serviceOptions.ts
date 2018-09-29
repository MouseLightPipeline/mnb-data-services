const configuration = {
    backupPath: "/opt/data/backup",
    exportPath:"/opt/data/export",
    ontologyPath: "/opt/data/OntologyAtlas.h5"
};

function loadConfiguration() {
    const options = Object.assign({}, configuration);

    options.backupPath = process.env.BACKUP_PATH || options.backupPath;
    options.exportPath = process.env.EXPORT_PATH || options.exportPath;
    options.ontologyPath = process.env.ONTOLOGY_PATH || options.ontologyPath;

    return options;
}

export const ServiceOptions = loadConfiguration();
