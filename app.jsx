import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, PlusCircle, Trash2, Search, CornerDownLeft, CornerDownRight, List, Link2, Filter, RefreshCw, GitFork, Binary, Users, TrendingUp, TrendingDown, Maximize, CheckCircle, XCircle } from 'lucide-react'; 


// --- Node and Structure Classes ---
class LinkedListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.id = crypto.randomUUID();
  }
}

class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.id = crypto.randomUUID();
    this.x = 0; this.y = 0; this.modifier = 0; this.level = 0;
    this.prelim = 0; this.thread = null; this.parent = null; 
  }
}

class GraphNode {
    constructor(value, x = 50, y = 50) {
        this.id = crypto.randomUUID(); this.value = value; this.x = x; this.y = y;
    }
}

class GraphEdge {
    constructor(sourceId, targetId) {
        this.id = crypto.randomUUID(); this.source = sourceId; this.target = targetId;
    }
}

// --- Custom Cloning Functions ---
function cloneTreeNode(node, parentClone = null) {
  if (!node) return null;
  const clonedNode = new TreeNode(node.value); 
  clonedNode.id = node.id; clonedNode.parent = parentClone; 
  clonedNode.left = cloneTreeNode(node.left, clonedNode);
  clonedNode.right = cloneTreeNode(node.right, clonedNode);
  return clonedNode;
}

function cloneLinkedList(head) {
    if (!head) return null;
    const newHead = new LinkedListNode(head.value); newHead.id = head.id; 
    let currentOriginal = head.next; let currentCloned = newHead;
    while (currentOriginal) {
        currentCloned.next = new LinkedListNode(currentOriginal.value);
        currentCloned.next.id = currentOriginal.id; 
        currentCloned = currentCloned.next; currentOriginal = currentOriginal.next;
    }
    return newHead;
}

// --- Main App Component ---
function App() {
  const [structureType, setStructureType] = useState('array'); 
  const [elements, setElements] = useState([]); 
  const [rootNode, setRootNode] = useState(null); 
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphEdges, setGraphEdges] = useState([]);
  const [graphStartNodeId, setGraphStartNodeId] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [inputValue2, setInputValue2] = useState(''); 
  const [removeValue, setRemoveValue] = useState(''); 
  const [searchValue, setSearchValue] = useState('');
  const [highlightedId, setHighlightedId] = useState(null); 
  const [highlightedIds, setHighlightedIds] = useState([]); 
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState([]);
  const [traversalPathIds, setTraversalPathIds] = useState([]); 
  const [traversalDisplayValues, setTraversalDisplayValues] = useState([]); 
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); 
  const [heapType, setHeapType] = useState('min'); 
  const [auth, setAuth] = useState(null); const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null); const [isAuthReady, setIsAuthReady] = useState(false);
  const svgRef = useRef(null);
  const [removingNodeId, setRemovingNodeId] = useState(null); 
  const [prevNodeIdLL, setPrevNodeIdLL] = useState(null); 


  const resetVisualState = () => {
    setHighlightedId(null); setHighlightedIds([]); setHighlightedEdgeIds([]);
    setTraversalPathIds([]); setTraversalDisplayValues([]); setMessage('');
    setRemovingNodeId(null); setPrevNodeIdLL(null); 
  };

  const handleStructureChange = (e) => {
    resetVisualState(); const newStructureType = e.target.value;
    setStructureType(newStructureType); setElements([]); setRootNode(null);
    setGraphNodes([]); setGraphEdges([]); setGraphStartNodeId('');
    setInputValue(''); setInputValue2(''); setRemoveValue(''); setSearchValue('');
  };
  
  const getNodeValuesFromIds = useCallback((ids, treeRoot) => {
    if (!treeRoot || !ids || ids.length === 0) return [];
    const idToNodeMap = new Map();
    const buildMap = (node) => {
        if (!node) return; idToNodeMap.set(node.id, node);
        buildMap(node.left); buildMap(node.right); };
    buildMap(treeRoot);
    return ids.map(id => {
        const node = idToNodeMap.get(id);
        return node ? String(node.value) : `ID:${String(id).substring(0,4)}?`; });
  }, []);

  // --- Array Operations ---
  const addToArray = () => { 
    if (!inputValue.trim()) { setMessage('Input value cannot be empty.'); return; }
    resetVisualState(); const newItem = { id: crypto.randomUUID(), value: inputValue.trim() };
    setElements(prev => [...prev, newItem]);
    setMessage(`Element "${inputValue.trim()}" added to Array.`); setInputValue('');
  };
  const removeFromArray = () => { 
    if (!removeValue.trim()) { setMessage('Value to remove cannot be empty.'); return; }
    resetVisualState(); const valueToRemove = removeValue.trim(); let found = false;
    for (let i = elements.length - 1; i >= 0; i--) {
        if (elements[i].value === valueToRemove) {
            setElements(prev => prev.filter((el, idx) => idx !== i));
            setMessage(`Element "${valueToRemove}" removed from Array.`); found = true; break; }}
    if (!found) setMessage(`Element "${valueToRemove}" not found in Array.`); setRemoveValue('');
  };
  const searchInArray = () => { 
    if (!searchValue.trim()) { setMessage('Search value cannot be empty.'); return; }
    resetVisualState(); const valueToSearch = searchValue.trim();
    const foundElement = elements.find(el => el.value === valueToSearch);
    if (foundElement) {
      setHighlightedId(foundElement.id);
      setMessage(`Element "${valueToSearch}" found at index ${elements.findIndex(el => el.id === foundElement.id)}.`);
    } else { setMessage(`Element "${valueToSearch}" not found in Array.`);}
  };
  const sortArray = async () => { 
    if (elements.length < 2) { setMessage('Array needs at least 2 elements to sort.'); return; }
    resetVisualState(); setIsProcessing(true); setMessage('Sorting array...');
    let sortedElements = [...elements]; 
    sortedElements.sort((a, b) => {
        const valA = a.value; const valB = b.value;
        const numA = parseFloat(valA); const numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA) && isNaN(numB)) return -1; 
        if (isNaN(numA) && !isNaN(numB)) return 1;  
        return String(valA).localeCompare(String(valB)); });
    await new Promise(resolve => setTimeout(resolve, elements.length * 40 + 150)); 
    setElements(sortedElements); setIsProcessing(false); setMessage('Array sorted.');
  };

  // --- Linked List Operations ---
  const addToLinkedListHead = () => { 
    if (!inputValue.trim()) { setMessage('Input value cannot be empty.'); return; }
    resetVisualState(); const newNode = new LinkedListNode(inputValue.trim());
    newNode.next = rootNode; setRootNode(newNode); 
    setMessage(`Element "${inputValue.trim()}" added to head.`); setInputValue('');
  };
  const addToLinkedListTail = () => { 
    if (!inputValue.trim()) { setMessage('Input value cannot be empty.'); return; }
    resetVisualState(); const newNode = new LinkedListNode(inputValue.trim());
    if (!rootNode) { setRootNode(newNode); } 
    else { let current = rootNode; while (current.next) current = current.next;
           current.next = newNode; setRootNode(cloneLinkedList(rootNode)); }
    setMessage(`Element "${inputValue.trim()}" added to tail.`); setInputValue('');
  };
  const removeFromLinkedListHead = async () => { 
    if (!rootNode) { setMessage('List is empty.'); return; }
    setIsProcessing(true); resetVisualState();
    setRemovingNodeId(rootNode.id); 
    setMessage(`Removing "${rootNode.value}" from head...`);
    await new Promise(resolve => setTimeout(resolve, 600)); 
    const removedValue = rootNode.value; setRootNode(rootNode.next); 
    setRemovingNodeId(null); setIsProcessing(false);
    setMessage(`Element "${removedValue}" removed from head.`);
  };
  const removeFromLinkedListTail = async () => { 
    if (!rootNode) { setMessage('List is empty.'); return; }
    setIsProcessing(true); resetVisualState();
    if (!rootNode.next) { 
      setRemovingNodeId(rootNode.id); setMessage(`Removing last node "${rootNode.value}"...`);
      await new Promise(resolve => setTimeout(resolve, 600));
      const removedValue = rootNode.value; setRootNode(null);
      setRemovingNodeId(null); setIsProcessing(false);
      setMessage(`Element "${removedValue}" removed (list empty).`); return;
    }
    let current = rootNode; let prev = null;
    while (current.next) { prev = current; current = current.next; }
    setRemovingNodeId(current.id); if(prev) setPrevNodeIdLL(prev.id); 
    setMessage(`Removing "${current.value}" from tail...`);
    await new Promise(resolve => setTimeout(resolve, 600));
    const removedValue = current.value; const clonedList = cloneLinkedList(rootNode); 
    let clonedCurrent = clonedList; let clonedPrev = null;
    while(clonedCurrent.id !== current.id) { clonedPrev = clonedCurrent; clonedCurrent = clonedCurrent.next; }
    if (clonedPrev) clonedPrev.next = null; 
    setRootNode(clonedList); setRemovingNodeId(null); setPrevNodeIdLL(null); setIsProcessing(false);
    setMessage(`Element "${removedValue}" removed from tail.`);
  };
  const removeFromLinkedListByValue = async () => {
    if (!removeValue.trim()) { setMessage('Value to remove cannot be empty.'); return; }
    if (!rootNode) { setMessage('List is empty.'); return; }
    setIsProcessing(true); resetVisualState(); const valueToRemove = removeValue.trim();
    let current = rootNode; let prev = null; let found = false;
    while(current) { if (current.value === valueToRemove) { found = true; break; }
                     prev = current; current = current.next; }
    if (!found) { setMessage(`Element "${valueToRemove}" not found.`); setIsProcessing(false); setRemoveValue(''); return; }
    setRemovingNodeId(current.id); if (prev) setPrevNodeIdLL(prev.id);
    setMessage(`Removing "${current.value}"...`);
    await new Promise(resolve => setTimeout(resolve, 700)); 
    let newRootNode;
    if (!prev) { newRootNode = rootNode.next; } 
    else { const clonedList = cloneLinkedList(rootNode); 
           let currentCloned = clonedList; let prevCloned = null;
           while(currentCloned && currentCloned.id !== current.id) { prevCloned = currentCloned; currentCloned = currentCloned.next; }
           if(prevCloned && currentCloned) { prevCloned.next = currentCloned.next; }
           newRootNode = clonedList; }
    setRootNode(newRootNode); setRemovingNodeId(null); setPrevNodeIdLL(null); setIsProcessing(false);
    setMessage(`Element "${current.value}" removed.`); setRemoveValue('');
  };
  const searchInLinkedList = () => { 
    if (!searchValue.trim()) { setMessage('Search value cannot be empty.'); return; }
    resetVisualState(); const valueToSearch = searchValue.trim();
    let current = rootNode; let index = 0; const path = [];
    while (current) { path.push(current.id);
      if (current.value === valueToSearch) {
        setHighlightedId(current.id); setTraversalPathIds(path); 
        setMessage(`Element "${valueToSearch}" found at index ${index}.`); return; }
      current = current.next; index++; }
    setTraversalPathIds(path); setMessage(`Element "${valueToSearch}" not found.`);
  };

  // --- Tree Operations ---
  const parseNodeValue = (val) => { const num = parseFloat(val); return isNaN(num) ? val.trim() : num; };
  const insertIntoBinaryTree = () => { 
    if (!inputValue.trim()) { setMessage('Input value cannot be empty.'); return; }
    resetVisualState(); setIsProcessing(true); const value = inputValue.trim();
    const newNode = new TreeNode(value);
    if (!rootNode) { setRootNode(newNode); } 
    else { const newTreeRoot = cloneTreeNode(rootNode); const queue = [newTreeRoot];
           while (queue.length > 0) { const current = queue.shift();
             if (!current.left) { current.left = newNode; newNode.parent = current; break; } 
             else { queue.push(current.left); }
             if (!current.right) { current.right = newNode; newNode.parent = current; break; } 
             else { queue.push(current.right); }}
           setRootNode(newTreeRoot); }
    setMessage(`Element "${value}" inserted into Binary Tree.`); setInputValue(''); setIsProcessing(false);
  };
  const searchInBinaryTree = async () => { 
    if (!searchValue.trim()) { setMessage('Search value cannot be empty.'); return; }
    if (!rootNode) { setMessage('Tree is empty.'); return; }
    resetVisualState(); setIsProcessing(true); const valueToSearch = searchValue.trim(); 
    const queue = [{ node: rootNode, path: [rootNode.id] }]; 
    let foundNode = null; let pathToFoundNodeIds = [];
    setMessage(`Searching for "${valueToSearch}"...`);
    while(queue.length > 0) {
        const { node, path } = queue.shift(); setTraversalPathIds([...path]); setHighlightedId(node.id);
        if (String(node.value) === valueToSearch) { foundNode = node; pathToFoundNodeIds = path; break; }
        if (node.left) queue.push({ node: node.left, path: [...path, node.left.id] });
        if (node.right) queue.push({ node: node.right, path: [...path, node.right.id] });
        await new Promise(resolve => setTimeout(resolve, 250)); }
    const displayValues = getNodeValuesFromIds(foundNode ? pathToFoundNodeIds : traversalPathIds, rootNode); 
    setTraversalDisplayValues(displayValues);
    if (foundNode) { setHighlightedId(foundNode.id); setTraversalPathIds(pathToFoundNodeIds);
                     setMessage(`Element "${valueToSearch}" found. Path: ${displayValues.join(' → ')}`); } 
    else { setHighlightedId(null); setMessage(`Element "${valueToSearch}" not found. Path explored: ${displayValues.join(' → ')}`); }
    setIsProcessing(false);
  };
  const insertIntoBST = () => { 
    if (!inputValue.trim()) { setMessage('Input value cannot be empty.'); return; }
    resetVisualState(); setIsProcessing(true); const rawValue = inputValue.trim(); 
    const valueToCompare = parseNodeValue(rawValue);
    const insertNodeRecursive = (node, valToStore, valToComp, parentNode) => {
      if (!node) { const newNode = new TreeNode(valToStore); newNode.parent = parentNode; return newNode; }
      const currentNodeComparableValue = parseNodeValue(node.value);
      if (typeof valToComp === 'number' && typeof currentNodeComparableValue === 'number') {
        if (valToComp < currentNodeComparableValue) node.left = insertNodeRecursive(node.left, valToStore, valToComp, node);
        else if (valToComp > currentNodeComparableValue) node.right = insertNodeRecursive(node.right, valToStore, valToComp, node);
      } else { const sValToComp = String(valToComp); const sCurrentNodeCompVal = String(currentNodeComparableValue);
        if (sValToComp < sCurrentNodeCompVal) node.left = insertNodeRecursive(node.left, valToStore, valToComp, node);
        else if (sValToComp > sCurrentNodeCompVal) node.right = insertNodeRecursive(node.right, valToStore, valToComp, node); }
      return node; };
    const currentClonedRoot = rootNode ? cloneTreeNode(rootNode) : null;
    const newRoot = insertNodeRecursive(currentClonedRoot, rawValue, valueToCompare, null);
    setRootNode(newRoot); setMessage(`Element "${rawValue}" inserted into BST.`);
    setInputValue(''); setIsProcessing(false);
  };
  const searchInBST = async () => { 
    if (!searchValue.trim()) { setMessage('Search value cannot be empty.'); return; }
    if (!rootNode) { setMessage('Tree is empty.'); return; }
    resetVisualState(); setIsProcessing(true); const valueToSearchComparable = parseNodeValue(searchValue.trim());
    let current = rootNode; let pathIds = []; let foundNode = null;
    setMessage(`Searching for "${searchValue.trim()}"...`);
    while(current){ pathIds.push(current.id); setTraversalPathIds([...pathIds]); setHighlightedId(current.id);
        const currentNodeComparableValue = parseNodeValue(current.value);
        if (valueToSearchComparable === currentNodeComparableValue) { foundNode = current; break; } 
        else if (typeof valueToSearchComparable === 'number' && typeof currentNodeComparableValue === 'number' ? 
                   valueToSearchComparable < currentNodeComparableValue : 
                   String(valueToSearchComparable) < String(currentNodeComparableValue)) { current = current.left; } 
        else { current = current.right; }
        await new Promise(resolve => setTimeout(resolve, 250)); }
    const displayValues = getNodeValuesFromIds(pathIds, rootNode); setTraversalDisplayValues(displayValues);
    if (foundNode) { setHighlightedId(foundNode.id); setMessage(`Element "${searchValue.trim()}" found. Path: ${displayValues.join(' → ')}`);} 
    else { setHighlightedId(null); setMessage(`Element "${searchValue.trim()}" not found. Path explored: ${displayValues.join(' → ')}`);}
    setIsProcessing(false);
  };
  const removeFromBST = () => { 
    if (!removeValue.trim()) { setMessage('Value to remove cannot be empty.'); return; }
    if (!rootNode) { setMessage('Tree is empty.'); return; }
    resetVisualState(); setIsProcessing(true); const valueToRemoveComparable = parseNodeValue(removeValue.trim());
    const findMinValueNode = (node) => { let current = node; while (current && current.left !== null) current = current.left; return current; };
    const deleteNodeRecursive = (currRoot, valToRemoveComp, parentNode) => {
        if (!currRoot) return null; const currRootComparableValue = parseNodeValue(currRoot.value);
        if (typeof valToRemoveComp === 'number' && typeof currRootComparableValue === 'number' ? 
            valToRemoveComp < currRootComparableValue : String(valToRemoveComp) < String(currRootComparableValue)) {
            currRoot.left = deleteNodeRecursive(currRoot.left, valToRemoveComp, currRoot);
        } else if (typeof valToRemoveComp === 'number' && typeof currRootComparableValue === 'number' ? 
                   valToRemoveComp > currRootComparableValue : String(valToRemoveComp) > String(currRootComparableValue)) {
            currRoot.right = deleteNodeRecursive(currRoot.right, valToRemoveComp, currRoot);
        } else { 
            if (!currRoot.left) { if(currRoot.right) currRoot.right.parent = parentNode; return currRoot.right; }
            else if (!currRoot.right) { if(currRoot.left) currRoot.left.parent = parentNode; return currRoot.left; }
            const temp = findMinValueNode(currRoot.right); currRoot.value = temp.value; currRoot.id = temp.id; 
            currRoot.right = deleteNodeRecursive(currRoot.right, parseNodeValue(temp.value), currRoot); }
        if (currRoot) currRoot.parent = parentNode; return currRoot; };
    const clonedCurrentRoot = cloneTreeNode(rootNode); 
    const newRoot = deleteNodeRecursive(clonedCurrentRoot, valueToRemoveComparable, null);
    setRootNode(newRoot); setMessage(`Attempted to remove "${removeValue.trim()}" from BST.`);
    setRemoveValue(''); setIsProcessing(false);
  };
  const performTreeTraversal = async (type) => { 
    if (!rootNode) { setMessage('Tree is empty.'); return; }
    resetVisualState(); setIsProcessing(true); let pathValuesAccumulator = []; let pathIdsToHighlight = [];  
    const traverseRecursive = (node) => {
      if (!node) return; const currentVal = String(node.value); 
      if (type === 'inOrder') { traverseRecursive(node.left); pathValuesAccumulator.push(currentVal); pathIdsToHighlight.push(node.id); traverseRecursive(node.right); } 
      else if (type === 'preOrder') { pathValuesAccumulator.push(currentVal); pathIdsToHighlight.push(node.id); traverseRecursive(node.left); traverseRecursive(node.right); } 
      else if (type === 'postOrder') { traverseRecursive(node.left); traverseRecursive(node.right); pathValuesAccumulator.push(currentVal); pathIdsToHighlight.push(node.id); }};
    traverseRecursive(rootNode); setMessage(`${type} Traversal In Progress...`);
    for (let i = 0; i < pathIdsToHighlight.length; i++) {
        setHighlightedId(pathIdsToHighlight[i]); setTraversalPathIds(pathIdsToHighlight.slice(0, i + 1));
        await new Promise(resolve => setTimeout(resolve, 350)); }
    setHighlightedId(null); setIsProcessing(false); setTraversalDisplayValues(pathValuesAccumulator);
    setMessage(`${type} Traversal Complete: ${pathValuesAccumulator.join(' → ')}`);
  };

  // --- Heap Operations ---
  const heapParent = (i) => Math.floor((i - 1) / 2); const heapLeft = (i) => 2 * i + 1; const heapRight = (i) => 2 * i + 2;
  const heapifyUp = (index, currentHeap, type) => { 
    let currentIndex = index; const item = currentHeap[currentIndex];
    while (currentIndex > 0) { const parentIndex = heapParent(currentIndex); const parentItem = currentHeap[parentIndex];
        const shouldSwap = type === 'min' ? parseNodeValue(item.value) < parseNodeValue(parentItem.value) : parseNodeValue(item.value) > parseNodeValue(parentItem.value);
        if (shouldSwap) { [currentHeap[currentIndex], currentHeap[parentIndex]] = [currentHeap[parentIndex], currentHeap[currentIndex]]; currentIndex = parentIndex; } 
        else break; }};
  const heapifyDown = (index, currentHeap, type) => { 
    let currentIndex = index; const n = currentHeap.length; const item = currentHeap[currentIndex];
    while (true) { let swapIndex = null; const leftChildIndex = heapLeft(currentIndex); const rightChildIndex = heapRight(currentIndex);
        if (leftChildIndex < n) { const leftChild = currentHeap[leftChildIndex];
            const shouldSwapLeft = type === 'min' ? parseNodeValue(leftChild.value) < parseNodeValue(item.value) : parseNodeValue(leftChild.value) > parseNodeValue(item.value);
            if (shouldSwapLeft) swapIndex = leftChildIndex; }
        if (rightChildIndex < n) { const rightChild = currentHeap[rightChildIndex]; const compareWith = swapIndex === null ? item : currentHeap[swapIndex];
            const shouldSwapRight = type === 'min' ? parseNodeValue(rightChild.value) < parseNodeValue(compareWith.value) : parseNodeValue(rightChild.value) > parseNodeValue(compareWith.value);
            if (shouldSwapRight) swapIndex = rightChildIndex; }
        if (swapIndex === null) break;
        [currentHeap[currentIndex], currentHeap[swapIndex]] = [currentHeap[swapIndex], currentHeap[currentIndex]]; currentIndex = swapIndex; }};
  const insertIntoHeap = () => { 
    if (!inputValue.trim()) { setMessage('Input value cannot be empty.'); return; }
    resetVisualState(); setIsProcessing(true); const newItem = { id: crypto.randomUUID(), value: inputValue.trim() };
    setElements(prevHeap => { const newHeap = [...prevHeap, newItem]; heapifyUp(newHeap.length - 1, newHeap, heapType); return newHeap; });
    setMessage(`Element "${inputValue.trim()}" inserted into ${heapType === 'min' ? 'Min' : 'Max'} Heap.`); setInputValue(''); setIsProcessing(false);
  };
  const extractFromHeap = () => { 
    if (elements.length === 0) { setMessage('Heap is empty.'); return; } resetVisualState(); setIsProcessing(true);
    const extractedItemValue = elements[0].value; 
    setElements(prevHeap => { const newHeap = [...prevHeap]; const lastItem = newHeap.pop();
        if (newHeap.length > 0) { newHeap[0] = lastItem; heapifyDown(0, newHeap, heapType); } return newHeap; });
    setMessage(`Element "${extractedItemValue}" extracted from ${heapType === 'min' ? 'Min' : 'Max'} Heap.`); setIsProcessing(false); 
  };

  // --- Graph Operations ---
  const addGraphNode = () => { 
    if (!inputValue.trim()) { setMessage('Node value cannot be empty.'); return; } resetVisualState();
    const x = 50 + (graphNodes.length % 6) * 90; const y = 50 + Math.floor(graphNodes.length / 6) * 90; 
    const newNode = new GraphNode(inputValue.trim(), x, y);
    setGraphNodes(prev => [...prev, newNode]);
    setMessage(`Node "${inputValue.trim()}" (ID: ${newNode.id.substring(0,4)}) added.`); setInputValue('');
  };
  const addGraphEdge = () => { 
    if (!inputValue.trim() || !inputValue2.trim()) { setMessage('Src/Tgt Node IDs/Values must be provided.'); return; } resetVisualState();
    const sourceIdentifier = inputValue.trim(); const targetIdentifier = inputValue2.trim();
    if (sourceIdentifier === targetIdentifier) { setMessage('Cannot add edge to self.'); return;}
    const sourceNode = graphNodes.find(n => n.id === sourceIdentifier || n.value === sourceIdentifier);
    const targetNode = graphNodes.find(n => n.id === targetIdentifier || n.value === targetIdentifier);
    if (!sourceNode || !targetNode) { setMessage('One or both nodes not found.'); return; }
    const edgeExists = graphEdges.some(edge => (edge.source === sourceNode.id && edge.target === targetNode.id) || (edge.source === targetNode.id && edge.target === sourceNode.id));
    if (edgeExists) { setMessage('Edge already exists.'); return; }
    const newEdge = new GraphEdge(sourceNode.id, targetNode.id); setGraphEdges(prev => [...prev, newEdge]);
    setMessage(`Edge between "${sourceNode.value}" & "${targetNode.value}" added.`); setInputValue(''); setInputValue2('');
  };
  const runGraphAlgorithm = async (algoType) => { 
    if (graphNodes.length === 0) { setMessage('Graph is empty.'); return; }
    const startIdentifier = graphStartNodeId.trim(); if (!startIdentifier) { setMessage('Provide Start Node ID/Value.'); return; }
    const startNode = graphNodes.find(n => n.id === startIdentifier || n.value === startIdentifier);
    if (!startNode) { setMessage('Start node not found.'); return; }
    resetVisualState(); setIsProcessing(true); setMessage(`${algoType.toUpperCase()} from "${startNode.value}"...`);
    const adj = new Map(); graphNodes.forEach(node => adj.set(node.id, []));
    graphEdges.forEach(edge => { adj.get(edge.source).push(edge.target); adj.get(edge.target).push(edge.source); });
    const visitedNodes = new Set(); const visitedEdgeIdsInternal = new Set(); const pathNodeIdsResult = []; 
    const stepDelay = 250;
    if (algoType === 'bfs') { const queue = [startNode.id]; visitedNodes.add(startNode.id); pathNodeIdsResult.push(startNode.id);
        setHighlightedIds([startNode.id]); await new Promise(r => setTimeout(r, stepDelay)); let head = 0;
        while(head < queue.length){ const u_id = queue[head++];
            for(const v_id of (adj.get(u_id) || [])){ if(!visitedNodes.has(v_id)){
                visitedNodes.add(v_id); pathNodeIdsResult.push(v_id);
                const edge = graphEdges.find(e => (e.source === u_id && e.target === v_id) || (e.source === v_id && e.target === u_id));
                if(edge) visitedEdgeIdsInternal.add(edge.id);
                setHighlightedIds(prev => [...prev, v_id]); setHighlightedEdgeIds(Array.from(visitedEdgeIdsInternal));
                await new Promise(r => setTimeout(r, stepDelay)); queue.push(v_id); }}}} 
    else if (algoType === 'dfs') { const stack = [{nodeId: startNode.id, parentId: null}];
        while(stack.length > 0) { const {nodeId: u_id, parentId: p_id} = stack.pop();
            if (!visitedNodes.has(u_id)) { visitedNodes.add(u_id); pathNodeIdsResult.push(u_id);
                setHighlightedIds(prev => [...prev, u_id]);
                if (p_id) { const edge = graphEdges.find(e => (e.source === p_id && e.target === u_id) || (e.source === u_id && e.target === p_id));
                            if(edge) visitedEdgeIdsInternal.add(edge.id); setHighlightedEdgeIds(Array.from(visitedEdgeIdsInternal)); }
                await new Promise(r => setTimeout(r, stepDelay));
                const neighbors = (adj.get(u_id) || []).reverse(); 
                for (const v_id of neighbors) { if (!visitedNodes.has(v_id)) stack.push({nodeId: v_id, parentId: u_id}); }}}}
    const pathValues = pathNodeIdsResult.map(id => graphNodes.find(n => n.id === id)?.value || 'Unknown');
    setTraversalDisplayValues(pathValues); setMessage(`${algoType.toUpperCase()} complete: ${pathValues.join(' → ')}`);
    setIsProcessing(false);
  };

  // --- Visualizer Components ---
  const ArrayVisualizer = ({ data, highlightId, isProcessing }) => ( 
    <div className={`flex flex-wrap gap-3 p-4 items-end min-h-[120px] bg-gray-700 rounded-lg shadow-lg transition-opacity duration-300 ${isProcessing ? 'opacity-70' : 'opacity-100'}`}>
      {data.length === 0 && <span className="text-gray-400 w-full text-center">Array is empty.</span>}
      {data.map((item, index) => ( <div key={item.id} className={`array-element-container flex flex-col items-center`}> <div title={item.value} className={`w-16 h-16 mb-1 flex items-center justify-center text-white font-mono text-sm rounded-md transition-all duration-300 ease-in-out shadow-md hover:shadow-lg ${item.id === highlightId ? 'bg-pink-500 ring-2 ring-pink-300 scale-110 shadow-xl' : 'bg-indigo-500 hover:bg-indigo-400'}`}> {String(item.value).substring(0,6)}{String(item.value).length > 6 ? '...' : ''} </div> <span className="text-xs text-gray-400 font-mono select-none">[{index}]</span> </div> ))} </div>
  );

  const LinkedListVisualizer = ({ head, highlightId, pathIds, removingNodeId, prevNodeId }) => { 
    const nodes = []; let current = head; while (current) { nodes.push(current); current = current.next; }
    if (nodes.length === 0) return <div className="p-4 min-h-[120px] bg-gray-700 rounded-lg shadow-lg flex items-center justify-center text-gray-400">Linked List is empty.</div>;
    return (
      <div className="flex flex-wrap gap-2 p-4 items-center min-h-[120px] bg-gray-700 rounded-lg shadow-lg overflow-x-auto">
        {nodes.map((node) => {
          let nodeClass = 'bg-sky-500 hover:bg-sky-400'; 
          if (node.id === removingNodeId) nodeClass = 'bg-red-500 ring-2 ring-red-300 scale-110 shadow-xl opacity-70 animate-pulse'; 
          else if (node.id === prevNodeId) nodeClass = 'bg-yellow-500 ring-2 ring-yellow-300 scale-105 shadow-lg'; 
          else if (node.id === highlightId || (pathIds && pathIds.includes(node.id))) nodeClass = 'bg-teal-500 ring-2 ring-teal-300 scale-110 shadow-xl'; 
          return (
            <React.Fragment key={node.id}>
              <div title={node.value} className={`w-20 h-16 flex flex-col items-center justify-center text-white font-mono text-sm rounded-md transition-all duration-300 ease-in-out shadow-md p-1 ${nodeClass}`}>
                <span className="block truncate w-full text-center">{String(node.value).substring(0,7)}{String(node.value).length > 7 ? '...' : ''}</span>
                <span className="text-xs text-gray-300 mt-1">next</span>
              </div>
              {node.next && (<ArrowRight className="text-gray-400 w-6 h-6 mx-1 shrink-0" />)}
              {!node.next && (<span className="text-gray-400 font-mono text-lg px-2 shrink-0">NULL</span>)}
            </React.Fragment>
          );})}
      </div>);
  };
  
const TreeVisualizer = ({ root, highlightId: currentHighlightId, pathIds }) => { 
    const nodeWidth = 60; const nodeHeight = 50; const levelHeight = 90; 
    const horizontalGapFactor = 0.5; // Increased from 0.4 for more spacing
    const [layout, setLayout] = useState({ nodes: [], edges: [], width: 300, height: 300, viewBox: "0 0 300 300" });
    
    const getLayout = useCallback((currentRoot) => {
        if (!currentRoot) return { nodes: [], edges: [], width: 300, height: 300, viewBox: "0 0 300 300" };
        const treeNodes = []; const treeEdges = []; let minX = Infinity, maxX = -Infinity, currentMaxY = 0; 
        function bfsLayout(startNode) {
            if (!startNode) return; const q = [{ node: startNode, level: 0, parentPos: null }]; 
            const nodesAtLevelCount = {}; let head = 0;
            while(head < q.length) { const {node, level} = q[head]; nodesAtLevelCount[level] = (nodesAtLevelCount[level] || 0) + 1;
                if (node.left) q.push({node: node.left, level: level + 1, parentPos: null});
                if (node.right) q.push({node: node.right, level: level + 1, parentPos: null}); head++; }
            const levelWidths = {}; let maxTreeWidthOverall = nodeWidth;
            Object.keys(nodesAtLevelCount).forEach(level => { const count = nodesAtLevelCount[level];
                levelWidths[level] = count * nodeWidth + Math.max(0, count - 1) * (nodeWidth * horizontalGapFactor); // Use factor
                maxTreeWidthOverall = Math.max(maxTreeWidthOverall, levelWidths[level]); });
            q.length = 0; head = 0; q.push({ node: startNode, level: 0, parentPos: null });
            const nodesProcessedAtLevel = {}; 
            while(head < q.length) { const {node, level, parentPos} = q.shift();
                nodesProcessedAtLevel[level] = (nodesProcessedAtLevel[level] || 0) + 1;
                const currentLevelActualWidth = levelWidths[level];
                const startXForLevel = (maxTreeWidthOverall - currentLevelActualWidth) / 2;
                const x = startXForLevel + (nodesProcessedAtLevel[level] - 1) * (nodeWidth + nodeWidth * horizontalGapFactor) + nodeWidth / 2; // Use factor
                const y = level * levelHeight + nodeHeight / 2;
                treeNodes.push({ id: node.id, value: String(node.value), x, y, level });
                minX = Math.min(minX, x - nodeWidth / 2); maxX = Math.max(maxX, x + nodeWidth / 2);
                currentMaxY = Math.max(currentMaxY, y + nodeHeight / 2);
                if (parentPos) { treeEdges.push({ id: `edge-${parentPos.id}-${node.id}`, sourceX: parentPos.x, sourceY: parentPos.y, targetX: x, targetY: y, sourceId: parentPos.id, targetId: node.id });}
                if (node.left) q.push({node: node.left, level: level + 1, parentPos: {x, y, id: node.id}});
                if (node.right) q.push({node: node.right, level: level + 1, parentPos: {x, y, id: node.id}}); }}
        bfsLayout(currentRoot);
        if (treeNodes.length === 0) return { nodes: [], edges: [], width: 300, height: 300, viewBox: "0 0 300 300" };
        const finalPadding = nodeWidth; const globalOffsetX = (minX === Infinity) ? 0 : -minX + finalPadding / 2;
        const globalOffsetY = finalPadding / 2;
        treeNodes.forEach(n => { n.x += globalOffsetX; n.y += globalOffsetY; });
        treeEdges.forEach(e => { e.sourceX += globalOffsetX; e.targetX += globalOffsetX; e.sourceY += globalOffsetY; e.targetY += globalOffsetY; });
        const finalWidth = (maxX === -Infinity) ? 300 : maxX - minX + finalPadding;
        const finalHeight = currentMaxY + finalPadding;
        return { nodes: treeNodes, edges: treeEdges, width: Math.max(300, finalWidth), height: Math.max(300, finalHeight), viewBox: `0 0 ${Math.max(300, finalWidth)} ${Math.max(300, finalHeight)}`};
    }, [nodeWidth, nodeHeight, levelHeight, horizontalGapFactor]); // Added horizontalGapFactor to dependencies
    useEffect(() => { setLayout(getLayout(root)); }, [root, getLayout]);
    if (!root) return <div className="p-4 min-h-[300px] bg-gray-700 rounded-lg shadow-lg flex items-center justify-center text-gray-400">Tree is empty.</div>;
    return ( <div className="relative w-full overflow-auto p-2 bg-gray-700 rounded-lg shadow-lg min-h-[300px] md:min-h-[400px]" style={{ height: `${Math.max(300, layout.height + 20)}px`}}> <svg width={layout.width} height={layout.height} viewBox={layout.viewBox} className="origin-top-left">
          {layout.edges.map(edge => ( <line key={edge.id} x1={edge.sourceX} y1={edge.sourceY + nodeHeight / 2 - 5} x2={edge.targetX} y2={edge.targetY - nodeHeight / 2 + 5} className={`stroke-current transition-colors duration-300 ${(pathIds && pathIds.includes(edge.sourceId) && pathIds.includes(edge.targetId)) ? 'text-pink-400 stroke-2 animate-pulse' : 'text-gray-500 stroke-1'}`}/> ))}
          {layout.nodes.map(node => ( <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>  <circle cx={0} cy={0} r={nodeHeight / 2 - 2} className={`transition-all duration-300 stroke-2 shadow-md ${(node.id === currentHighlightId || (pathIds && pathIds.includes(node.id))) ? 'fill-purple-500 stroke-purple-300 scale-110' : 'fill-sky-600 stroke-sky-400 hover:fill-sky-500'}`} /> <text x={0} y={0} dy=".3em" textAnchor="middle" title={node.value} className="fill-white text-xs sm:text-sm font-mono select-none pointer-events-none transition-opacity duration-300"> {String(node.value).substring(0,5)}{String(node.value).length > 5 ? '…' : ''} </text> </g> ))} </svg> </div>);};

  const HeapVisualizer = ({ heapArray, type, highlightId }) => { 
    const nodeWidth = 55; const nodeHeight = 45; const levelHeight = 70; 
    const horizontalGapFactor = 0.5; // Increased from 0.3 for more spacing
    const treeNodes = []; const treeEdges = [];
    let minX = Infinity, maxX = -Infinity, currentMaxY = 0;
    if (heapArray.length > 0) { const nodePositions = {}; const q = [{idx: 0, level: 0, parentPos: null}];
        const nodesAtLevelsCount = {}; let head = 0;
        while(head < q.length) { const {idx, level} = q[head]; if(idx >= heapArray.length) { head++; continue; }
            nodesAtLevelsCount[level] = (nodesAtLevelsCount[level] || 0) + 1;
            if(heapLeft(idx) < heapArray.length) q.push({idx: heapLeft(idx), level: level+1});
            if(heapRight(idx) < heapArray.length) q.push({idx: heapRight(idx), level: level+1}); head++; }
        const levelWidths = {}; let maxTreeWidthOverall = nodeWidth;
        Object.keys(nodesAtLevelsCount).forEach(level => { const count = nodesAtLevelsCount[level];
            levelWidths[level] = count * nodeWidth + Math.max(0, count - 1) * (nodeWidth * horizontalGapFactor); // Use factor
            maxTreeWidthOverall = Math.max(maxTreeWidthOverall, levelWidths[level]); });
        q.length = 0; head = 0; q.push({idx: 0, level: 0, parentPos: null}); const placedAtLevelCount = {};
        while(head < q.length){ const {idx, level, parentPos} = q.shift(); if(idx >= heapArray.length) continue;
            placedAtLevelCount[level] = (placedAtLevelCount[level] || 0) + 1;
            const y = level * levelHeight + nodeHeight / 2; const currentLevelActualWidth = levelWidths[level];
            const startXForLevel = (maxTreeWidthOverall - currentLevelActualWidth) / 2;
            const x = startXForLevel + (placedAtLevelCount[level]-1) * (nodeWidth + nodeWidth * horizontalGapFactor) + nodeWidth/2; // Use factor
            nodePositions[idx] = {x,y}; 
            treeNodes.push({ id: heapArray[idx].id, value: String(heapArray[idx].value), x, y, level, originalIndex: idx });
            minX = Math.min(minX, x - nodeWidth/2); maxX = Math.max(maxX, x + nodeWidth/2); currentMaxY = Math.max(currentMaxY, y + nodeHeight/2);
            if (parentPos) { treeEdges.push({ id: `heap-edge-${heapArray[heapParent(idx)].id}-${heapArray[idx].id}`, sourceX: parentPos.x, sourceY: parentPos.y, targetX: x, targetY: y, sourceId: heapArray[heapParent(idx)].id, targetId: heapArray[idx].id });}
            const leftChildIdx = heapLeft(idx); const rightChildIdx = heapRight(idx);
            if (leftChildIdx < heapArray.length) q.push({idx: leftChildIdx, level: level + 1, parentPos: {x,y}});
            if (rightChildIdx < heapArray.length) q.push({idx: rightChildIdx, level: level + 1, parentPos: {x,y}});}}
    const finalPadding = nodeWidth; const globalOffsetX = (treeNodes.length > 0 && minX !== Infinity) ? (-minX + finalPadding / 2) : 0;
    const globalOffsetY = finalPadding / 2;
    treeNodes.forEach(n => { n.x += globalOffsetX; n.y += globalOffsetY; });
    treeEdges.forEach(e => { e.sourceX += globalOffsetX; e.targetX += globalOffsetX; e.sourceY += globalOffsetY; e.targetY += globalOffsetY; });
    const finalWidth = (treeNodes.length > 0 && maxX !== -Infinity) ? (maxX - minX + finalPadding) : 300;
    const finalHeight = currentMaxY + finalPadding;
    if (heapArray.length === 0) return <div className="p-4 min-h-[300px] bg-gray-700 rounded-lg shadow-lg flex items-center justify-center text-gray-400">Heap is empty.</div>;
    return ( <div className="space-y-4"> <div className="p-3 bg-gray-600 rounded-md shadow"> <h4 className="text-sm font-semibold text-gray-200 mb-2">Array Rep:</h4> <div className="flex flex-wrap gap-2"> {heapArray.map((item, index) => ( <div key={`arr-${item.id}`} className="flex flex-col items-center"> <div title={item.value} className={`w-12 h-12 flex items-center justify-center text-white text-xs font-mono rounded ${item.id === highlightId ? 'bg-pink-500' : 'bg-indigo-500'}`}> {String(item.value).substring(0,4)}{String(item.value).length > 4 ? '…' : ''}</div> <span className="text-xs text-gray-300 mt-0.5">[{index}]</span></div>)) }</div></div> <div className="relative w-full overflow-auto p-2 bg-gray-700 rounded-lg shadow-lg min-h-[200px] md:min-h-[250px]" style={{ height: `${Math.max(250, finalHeight + 20)}px`}}> <svg width={Math.max(300, finalWidth)} height={Math.max(250, finalHeight)} viewBox={`0 0 ${Math.max(300, finalWidth)} ${Math.max(250, finalHeight)}`} className="origin-top-left"> {treeEdges.map(edge => ( <line key={edge.id} x1={edge.sourceX} y1={edge.sourceY + nodeHeight/2 - 5} x2={edge.targetX} y2={edge.targetY - nodeHeight/2 + 5} className="stroke-gray-500 stroke-1" />))} {treeNodes.map(node => ( <g key={`tree-${node.id}`} transform={`translate(${node.x}, ${node.y})`}> <circle cx="0" cy="0" r={nodeHeight/2 - 2} className={`transition-colors duration-300 stroke-2 ${(node.id === highlightId) ? 'fill-pink-500 stroke-pink-300 scale-105' : 'fill-green-600 stroke-green-400'}`} /> <text x="0" y="0" dy=".3em" textAnchor="middle" title={node.value} className="fill-white text-xs font-mono select-none pointer-events-none"> {String(node.value).substring(0,4)}{String(node.value).length > 4 ? '…' : ''}</text></g>))}</svg></div></div>);};

const GraphVisualizer = ({ nodes, edges, highlightedNodes, highlightedEdges, onNodeDrag, onNodeDragEnd, svgRef }) => { 
    const nodeRadius = 25; const [dragInfo, setDragInfo] = useState(null); 
    const handleMouseDown = (e, nodeId) => { if (!svgRef.current) return; const CTM = svgRef.current.getScreenCTM().inverse(); const pt = svgRef.current.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const svgP = pt.matrixTransform(CTM); const node = nodes.find(n => n.id === nodeId); if (node) setDragInfo({ id: nodeId, offsetX: svgP.x - node.x, offsetY: svgP.y - node.y });};
    const handleMouseMove = useCallback((e) => { if (!dragInfo || !svgRef.current) return; e.preventDefault(); const CTM = svgRef.current.getScreenCTM().inverse(); const pt = svgRef.current.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const svgP = pt.matrixTransform(CTM); onNodeDrag(dragInfo.id, svgP.x - dragInfo.offsetX, svgP.y - dragInfo.offsetY);}, [dragInfo, onNodeDrag, svgRef]);
    const handleMouseUp = useCallback(() => { if(dragInfo) onNodeDragEnd(dragInfo.id); setDragInfo(null);}, [dragInfo, onNodeDragEnd]);
    useEffect(() => { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp);};}, [handleMouseMove, handleMouseUp]); 
    if (nodes.length === 0) return <div className="p-4 min-h-[300px] bg-gray-700 rounded-lg shadow-lg flex items-center justify-center text-gray-400">Graph is empty.</div>;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    return ( <div className="relative w-full h-[400px] md:h-[500px] bg-gray-700 rounded-lg shadow-lg overflow-hidden cursor-grab active:cursor-grabbing" style={{touchAction: 'none'}}> <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet"> <defs><pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(107, 114, 128, 0.2)" strokeWidth="0.5"/></pattern><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="url(#smallGrid)"/><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(107, 114, 128, 0.3)" strokeWidth="1"/></pattern></defs> <rect width="100%" height="100%" fill="url(#grid)" /> {edges.map(edge => { const sourceNode = nodeMap.get(edge.source); const targetNode = nodeMap.get(edge.target); if (!sourceNode || !targetNode) return null; return (<line key={edge.id} x1={sourceNode.x} y1={sourceNode.y} x2={targetNode.x} y2={targetNode.y} className={`transition-all duration-300 ease-in-out ${(highlightedEdges && highlightedEdges.includes(edge.id)) ? 'stroke-pink-400 stroke-[3px] animate-pulse' : 'stroke-gray-500 stroke-[2px]'}`}/>);})} {nodes.map(node => ( <g key={node.id} transform={`translate(${node.x}, ${node.y})`} onMouseDown={(e) => handleMouseDown(e, node.id)} onTouchStart={(e) => { e.preventDefault(); const touch = e.touches[0]; handleMouseDown(touch, node.id); }} className="cursor-pointer group"> <circle cx="0" cy="0" r={nodeRadius} className={`transition-all duration-300 ease-in-out stroke-2 group-hover:stroke-purple-300 ${(highlightedNodes && highlightedNodes.includes(node.id)) ? 'fill-purple-500 stroke-purple-300 scale-110' : 'fill-sky-600 stroke-sky-400'}`}/> <text x="0" y="0" dy=".3em" textAnchor="middle" title={node.value} className="fill-white text-xs font-mono select-none pointer-events-none"> {String(node.value).substring(0,6)}{String(node.value).length > 6 ? '…' : ''}</text> <text x="0" y={nodeRadius + 12} textAnchor="middle" className="fill-gray-400 text-[10px] font-mono select-none pointer-events-none opacity-70 group-hover:opacity-100"> ID: {node.id.substring(0,4)}</text></g>))}</svg></div>);};
  const handleGraphNodeDrag = (nodeId, x, y) => { setGraphNodes(prevNodes => prevNodes.map(n => n.id === nodeId ? { ...n, x, y } : n)); };
  const handleGraphNodeDragEnd = (nodeId) => { /* No specific action */ };

  // --- Render Controls ---
  const renderControls = () => {
    const commonInputClass = "w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder-gray-400";
    const commonButtonClass = "flex items-center justify-center gap-2 w-full p-2.5 rounded-lg text-white font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg";
    const primaryButtonClass = `${commonButtonClass} bg-purple-600 hover:bg-purple-500 focus:ring-purple-400`;
    const secondaryButtonClass = `${commonButtonClass} bg-pink-600 hover:bg-pink-500 focus:ring-pink-400`;
    const tertiaryButtonClass = `${commonButtonClass} bg-teal-600 hover:bg-teal-500 focus:ring-teal-400`;
    const destructiveButtonClass = `${commonButtonClass} bg-red-600 hover:bg-red-500 focus:ring-red-400`;

    if (structureType === 'array') return ( 
        <div className="space-y-4"> <div> <label htmlFor="arr-add" className="block text-sm font-medium text-gray-300 mb-1">Add Element:</label> <input type="text" id="arr-add" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter value" className={commonInputClass} /> <button onClick={addToArray} className={`${primaryButtonClass} mt-2`} disabled={isProcessing}> <PlusCircle size={18} /> Add </button> </div> <div> <label htmlFor="arr-remove" className="block text-sm font-medium text-gray-300 mb-1">Remove (by value, last):</label> <input type="text" id="arr-remove" value={removeValue} onChange={(e) => setRemoveValue(e.target.value)} placeholder="Enter value" className={commonInputClass} /> <button onClick={removeFromArray} className={`${destructiveButtonClass} mt-2`} disabled={isProcessing}> <Trash2 size={18} /> Remove </button> </div> <div> <label htmlFor="arr-search" className="block text-sm font-medium text-gray-300 mb-1">Search Element:</label> <input type="text" id="arr-search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Enter value" className={commonInputClass} /> <button onClick={searchInArray} className={`${secondaryButtonClass} mt-2`} disabled={isProcessing}> <Search size={18} /> Search </button> </div> <div> <button onClick={sortArray} className={`${tertiaryButtonClass} mt-2`} disabled={isProcessing || elements.length < 2}> {isProcessing && structureType === 'array' ? <RefreshCw size={18} className="animate-spin" /> : <Filter size={18} />} {isProcessing && structureType === 'array' ? 'Sorting...' : 'Sort Array'} </button> </div> </div> );
    else if (structureType === 'linkedList') return ( 
        <div className="space-y-4">
          <div> <label htmlFor="ll-value" className="block text-sm font-medium text-gray-300 mb-1">Value for Add:</label> <input type="text" id="ll-value" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter value" className={commonInputClass} /> <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2"> <button onClick={addToLinkedListHead} className={`${primaryButtonClass}`} disabled={isProcessing}> <CornerDownLeft size={18} /> Add Head </button> <button onClick={addToLinkedListTail} className={`${primaryButtonClass}`} disabled={isProcessing}> <CornerDownRight size={18} /> Add Tail </button> </div> </div>
          <div> <label htmlFor="ll-remove-value" className="block text-sm font-medium text-gray-300 mb-1">Remove by Value:</label> <input type="text" id="ll-remove-value" value={removeValue} onChange={(e) => setRemoveValue(e.target.value)} placeholder="Enter value to remove" className={commonInputClass} /> <button onClick={removeFromLinkedListByValue} className={`${destructiveButtonClass} mt-2`} disabled={isProcessing || !rootNode}> <XCircle size={18} /> Remove Value</button> </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"> <button onClick={removeFromLinkedListHead} className={`${destructiveButtonClass}`} disabled={isProcessing || !rootNode}> Remove Head </button> <button onClick={removeFromLinkedListTail} className={`${destructiveButtonClass}`} disabled={isProcessing || !rootNode}> Remove Tail </button> </div>
          <div> <label htmlFor="ll-search" className="block text-sm font-medium text-gray-300 mb-1">Search:</label> <input type="text" id="ll-search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Enter value" className={commonInputClass} /> <button onClick={searchInLinkedList} className={`${secondaryButtonClass} mt-2`} disabled={isProcessing || !rootNode}> <Search size={18} /> Search </button> </div>
        </div> );
    else if (structureType === 'binaryTree' || structureType === 'bst') return ( 
        <div className="space-y-4"> <div> <label htmlFor="tree-add" className="block text-sm font-medium text-gray-300 mb-1">Insert Node:</label> <input type="text" id="tree-add" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={structureType === 'bst' ? "Number or string (for BST)" : "Enter any value"} className={commonInputClass} /> <button onClick={structureType === 'bst' ? insertIntoBST : insertIntoBinaryTree} className={`${primaryButtonClass} mt-2`} disabled={isProcessing}> <PlusCircle size={18} /> Insert </button> </div> {structureType === 'bst' && ( <div> <label htmlFor="bst-remove" className="block text-sm font-medium text-gray-300 mb-1">Remove Node (BST):</label> <input type="text" id="bst-remove" value={removeValue} onChange={(e) => setRemoveValue(e.target.value)} placeholder="Enter value to remove" className={commonInputClass} /> <button onClick={removeFromBST} className={`${destructiveButtonClass} mt-2`} disabled={isProcessing || !rootNode}> <Trash2 size={18} /> Remove </button> </div> )} <div> <label htmlFor="tree-search" className="block text-sm font-medium text-gray-300 mb-1">Search Node:</label> <input type="text" id="tree-search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Enter value" className={commonInputClass} /> <button onClick={structureType === 'bst' ? searchInBST : searchInBinaryTree} className={`${secondaryButtonClass} mt-2`} disabled={isProcessing || !rootNode}> <Search size={18}/> Search {structureType === 'bst' ? 'BST': 'Tree'} </button> </div> <div> <label className="block text-sm font-medium text-gray-300 mb-1">Traversals:</label> <div className="grid grid-cols-1 sm:grid-cols-3 gap-2"> <button onClick={() => performTreeTraversal('inOrder')} className={`${tertiaryButtonClass}`} disabled={isProcessing || !rootNode}>In-Order</button> <button onClick={() => performTreeTraversal('preOrder')} className={`${tertiaryButtonClass}`} disabled={isProcessing || !rootNode}>Pre-Order</button> <button onClick={() => performTreeTraversal('postOrder')} className={`${tertiaryButtonClass}`} disabled={isProcessing || !rootNode}>Post-Order</button> </div> </div> </div> );
    else if (structureType === 'heap') return ( 
            <div className="space-y-4"> <div> <label htmlFor="heap-type-select" className="block text-sm font-medium text-gray-300 mb-1">Heap Type:</label> <select id="heap-type-select" value={heapType} onChange={(e) => { setHeapType(e.target.value); setElements([]); setMessage(`Switched to ${e.target.value} Heap. Cleared.`);}} className={commonInputClass}> <option value="min">Min Heap</option> <option value="max">Max Heap</option> </select> </div> <div> <label htmlFor="heap-add" className="block text-sm font-medium text-gray-300 mb-1">Insert Element:</label> <input type="text" id="heap-add" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter value" className={commonInputClass} /> <button onClick={insertIntoHeap} className={`${primaryButtonClass} mt-2`} disabled={isProcessing}> <PlusCircle size={18} /> Insert to {heapType === 'min' ? 'Min' : 'Max'} Heap </button> </div> <div> <button onClick={extractFromHeap} className={`${destructiveButtonClass} mt-2`} disabled={isProcessing || elements.length === 0}> {heapType === 'min' ? <TrendingDown size={18} /> : <TrendingUp size={18} />} Extract {heapType === 'min' ? 'Min' : 'Max'} </button> </div> </div> );
    else if (structureType === 'graph') return ( 
            <div className="space-y-4"> <div> <label htmlFor="graph-node-add" className="block text-sm font-medium text-gray-300 mb-1">Add Node:</label> <input type="text" id="graph-node-add" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Node value" className={commonInputClass} /> <button onClick={addGraphNode} className={`${primaryButtonClass} mt-2`} disabled={isProcessing}> <PlusCircle size={18}/> Add Node</button> </div> <div> <label className="block text-sm font-medium text-gray-300 mb-1">Add Edge (Undirected):</label> <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Source Node ID or Value" className={`${commonInputClass} mb-2`} /> <input type="text" value={inputValue2} onChange={(e) => setInputValue2(e.target.value)} placeholder="Target Node ID or Value" className={commonInputClass} /> <button onClick={addGraphEdge} className={`${primaryButtonClass} mt-2`} disabled={isProcessing || graphNodes.length < 2}> <Link2 size={18}/> Add Edge</button> </div> <div> <label htmlFor="graph-start-node" className="block text-sm font-medium text-gray-300 mb-1">Start Node for Traversal:</label> <input type="text" id="graph-start-node" value={graphStartNodeId} onChange={(e) => setGraphStartNodeId(e.target.value)} placeholder="Start Node ID or Value" className={commonInputClass} /> </div> <div> <label className="block text-sm font-medium text-gray-300 mb-1">Run Algorithm:</label> <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"> <button onClick={() => runGraphAlgorithm('bfs')} className={`${tertiaryButtonClass}`} disabled={isProcessing || graphNodes.length === 0 || !graphStartNodeId.trim()}>BFS</button> <button onClick={() => runGraphAlgorithm('dfs')} className={`${tertiaryButtonClass}`} disabled={isProcessing || graphNodes.length === 0 || !graphStartNodeId.trim()}>DFS</button> </div> </div> </div> );
    return null;
  };

  if (!isAuthReady) { return ( <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center"> <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mb-4"></div> <p className="text-xl font-semibold">Initializing Visualizer...</p> </div> );}

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 font-sans">
      <header className="w-full max-w-7xl mb-6 text-center"> <h1 className="text-3xl sm:text-4xl font-bold text-purple-400 tracking-tight">Interactive Data Structure Visualizer</h1> {userId && (<p className="text-xs text-gray-500 mt-1">Session ID: <span className="font-mono">{userId.substring(0,12)}...</span></p>)} </header>
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1 bg-gray-800 p-5 sm:p-6 rounded-xl shadow-2xl h-fit sticky top-6"> <div className="mb-6"> <label htmlFor="structure-type" className="block text-lg font-semibold text-purple-300 mb-2">Select Structure:</label> <div className="relative"> <select id="structure-type" value={structureType} onChange={handleStructureChange} className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 appearance-none focus:ring-2 focus:ring-purple-500 outline-none pr-10 font-medium" > <option value="array">Array</option> <option value="linkedList">Linked List</option> <option value="binaryTree">Binary Tree</option> <option value="bst">Binary Search Tree (BST)</option> <option value="heap">Heap (Min/Max)</option> <option value="graph">Graph</option> </select> <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400"> {structureType === 'array' && <List size={20}/>} {structureType === 'linkedList' && <Link2 size={20}/>} {(structureType === 'binaryTree' || structureType === 'bst') && <Binary size={20}/>} {structureType === 'heap' && <Maximize rotate={45} size={20}/>}  {structureType === 'graph' && <Users size={20}/>} </div> </div> </div> {renderControls()} </aside>
        <main className="lg:col-span-2 bg-gray-800 p-5 sm:p-6 rounded-xl shadow-2xl"> <h2 className="text-xl sm:text-2xl font-semibold text-purple-300 mb-4 capitalize">{structureType} Visualization</h2>
          {structureType === 'array' && <ArrayVisualizer data={elements} highlightId={highlightedId} isProcessing={isProcessing} />}
          {structureType === 'linkedList' && <LinkedListVisualizer head={rootNode} highlightId={highlightedId} pathIds={traversalPathIds} removingNodeId={removingNodeId} prevNodeId={prevNodeIdLL} />}
          {(structureType === 'binaryTree' || structureType === 'bst') && <TreeVisualizer root={rootNode} highlightId={highlightedId} pathIds={traversalPathIds} />}
          {structureType === 'heap' && <HeapVisualizer heapArray={elements} type={heapType} highlightId={highlightedId} />}
          {structureType === 'graph' && <GraphVisualizer nodes={graphNodes} edges={graphEdges} highlightedNodes={highlightedIds} highlightedEdges={highlightedEdgeIds} onNodeDrag={handleGraphNodeDrag} onNodeDragEnd={handleGraphNodeDragEnd} svgRef={svgRef} />}
          {message && ( <div className={`mt-4 p-3 rounded-lg text-sm font-medium shadow-md flex items-center gap-2 ${message.toLowerCase().includes('error') || message.toLowerCase().includes('fail') || message.includes('not found') || message.includes('cannot') || message.includes('empty') ? 'bg-red-800 text-red-100 border border-red-600' : (message.toLowerCase().includes('complete') || message.toLowerCase().includes('found') || message.toLowerCase().includes('added') || message.toLowerCase().includes('inserted') || message.toLowerCase().includes('removed') || message.toLowerCase().includes('extracted')) ? 'bg-green-800 text-green-100 border border-green-600' : 'bg-blue-800 text-blue-100 border border-blue-600'}`}>  {(message.toLowerCase().includes('complete') || message.toLowerCase().includes('found') || message.toLowerCase().includes('added') || message.toLowerCase().includes('inserted') || message.toLowerCase().includes('removed') || message.toLowerCase().includes('extracted')) && !message.toLowerCase().includes('error') && <CheckCircle size={18}/>} {message} </div> )}
          {(traversalDisplayValues.length > 0 && !isProcessing && (message.toLowerCase().includes('complete') || message.toLowerCase().includes('found'))) && ( <div className="mt-4 p-3 rounded-lg bg-gray-700 text-gray-200 text-sm shadow"> <span className="font-semibold text-gray-300">Result Path/Order: </span>{traversalDisplayValues.join(' → ')} </div> )}
        </main>
      </div>
      <footer className="mt-8 py-4 text-center text-gray-500 text-xs sm:text-sm"> <p>&copy; {new Date().getFullYear()} Interactive Data Structure Visualizer. Refined Animations.</p> <p className="mt-1">Tip: Graph Node IDs are short. Use ID or exact Value for operations.</p> </footer>
      <style> {` @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'); body { font-family: 'Inter', sans-serif; background-color: #111827; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; } .animate-pulse-slow { animation: ds-custom-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; } @keyframes ds-custom-pulse { 0%, 100% { opacity: 0.6; stroke-opacity: 0.6; } 50% { opacity: 1; stroke-opacity: 1;} } ::-webkit-scrollbar { width: 8px; height: 8px; } ::-webkit-scrollbar-track { background: #1f2937; border-radius: 10px; } ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 10px; } ::-webkit-scrollbar-thumb:hover { background: #6b7280; } .transition-colors { transition-property: background-color, border-color, color, fill, stroke; } .scale-110 { transform: scale(1.10); } `} </style>
    </div>);
}

export default App;
