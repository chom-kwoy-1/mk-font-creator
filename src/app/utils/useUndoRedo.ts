import React from "react";

export function useUndoRedo<T>(initialState: T): [
    T,
    (document: T) => void,
    () => boolean,
    () => boolean,
    () => void,
    (document: T) => void,
] {
    const [document, setDocument] = React.useState(initialState);
    const [undoStack, setUndoStack] = React.useState<T[]>([initialState]);
    const [redoStack, setRedoStack] = React.useState<T[]>([]);

    const store = React.useCallback(() => {
        const newUndoStack = [...undoStack, document];
        setUndoStack(newUndoStack);
        setRedoStack([]);
    }, [undoStack, document]);

    const undo = React.useCallback(() => {
        if(undoStack.length > 1) {
            const last = undoStack[undoStack.length - 1];
            const desired = undoStack[undoStack.length - 2];
            setUndoStack(undoStack.slice(0, undoStack.length - 1));
            setRedoStack([...redoStack, last]);
            setDocument(desired);
            return true;
        }
        return false;
    }, [undoStack, redoStack]);

    const redo = React.useCallback(() => {
        if(redoStack.length > 0) {
            const last = redoStack[redoStack.length - 1];
            setUndoStack([...undoStack, last]);
            setRedoStack(redoStack.slice(0, redoStack.length - 1));
            setDocument(last);
            return true;
        }
        return false;
    }, [undoStack, redoStack]);

    const reset = React.useCallback((document: T) => {
        setDocument(document);
        setUndoStack([document]);
        setRedoStack([]);
    }, []);

    return [ document, setDocument, undo, redo, store, reset ];
}
