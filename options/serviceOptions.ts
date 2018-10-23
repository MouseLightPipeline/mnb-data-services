const configuration = {
    backupPath: "/opt/data/backup",
    restorePath: "/opt/data/restore",
    exportPath: "/opt/data/export",
    ontologyPath: "/opt/data/OntologyAtlas.h5"
};

function loadConfiguration() {
    const options = Object.assign({}, configuration);

    // Although these can be changed vai environment variables, it is generally simpler to just map the appropriate
    // external location to the default internal path with a --volume argument.
    options.backupPath = process.env.BACKUP_PATH || options.backupPath;
    options.restorePath = process.env.RESTORE_PATH || options.restorePath;
    options.exportPath = process.env.EXPORT_PATH || options.exportPath;
    options.ontologyPath = process.env.ONTOLOGY_PATH || options.ontologyPath;

    return options;
}

export const ServiceOptions = loadConfiguration();
