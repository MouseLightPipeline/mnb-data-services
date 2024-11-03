export interface IManualAnnotations {
    somaCompartmentId?: number;
    curatedCompartmentId?: number;
    legacyCompartmentIds?: number[];
    procrustesAxon?: number;
    procrustesDend?: number;
}

export interface IExternalReferences {
    hortaCloud?: string;
}
export interface IAnnotationMetadata {
    manualAnnotations?: IManualAnnotations;
    externalReferences?: IExternalReferences;
}
