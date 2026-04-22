import { createEdgeStoreProvider } from "@edgestore/react";
import { type EdgeStoreRouter } from "./edgestore-router";

const { EdgeStoreProvider, useEdgeStore } =
  createEdgeStoreProvider<EdgeStoreRouter>();

export { EdgeStoreProvider, useEdgeStore };