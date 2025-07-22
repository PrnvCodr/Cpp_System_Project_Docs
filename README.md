# Comprehensive C++ Terminal Chat Server Code Documentation

## Table of Contents
1. [Network Architecture & Socket Programming](#network-architecture)
2. [Multi-Threading Model](#multi-threading-model)
3. [Ncurses User Interface System](#ncurses-ui-system)
4. [Cache Implementation with LRU Algorithm](#cache-implementation)
5. [Client-Server Communication Protocol](#communication-protocol)
6. [Command System](#command-system)
7. [Error Handling and Resource Management](#error-handling)
8. [Memory Management and Thread Safety](#memory-management)

---

## Network Architecture & Socket Programming

### Socket Utility Functions (`sockutil.cpp`)
```cpp
int createTCPipv4socket() {
    return socket(AF_INET, SOCK_STREAM, 0);
}
```
**Function Purpose**: Creates a TCP/IPv4 socket using Berkeley sockets API
- **Protocol**: TCP (SOCK_STREAM) for reliable, connection-oriented communication
- **Address Family**: AF_INET for IPv4 networking
- **Return Value**: Socket file descriptor or -1 on failure

### Server Socket Setup Process
The server follows standard socket programming steps:

1. **Socket Creation**: `createTCPipv4socket()` creates the listening socket
2. **Address Binding**: 
   ```cpp
   server_addr.sin_family = AF_INET;
   server_addr.sin_port = htons(PORT_NO);
   server_addr.sin_addr.s_addr = INADDR_ANY;
   ```
3. **Listen Queue**: `listen(server_socket, 8)` - accepts up to 8 pending connections
4. **Accept Loop**: Continuously accepts new client connections

### Client Connection Process
```cpp
if (connect(CLIENT_SOCKET, (struct sockaddr *)&client_addr, sizeof(client_addr)) < 0) {
    perror("Connection error");
    exit(-1);
}
```
- Uses `inet_pton()` for IP address conversion
- Establishes connection to server before UI initialization
- Proper error handling with perror() for debugging

---

## Multi-Threading Model

### Server Threading Architecture

#### Main Server Thread
- Handles incoming connections in infinite loop
- Creates new thread for each client using `std::thread`
- Manages global client vector with mutex protection

#### Per-Client Handler Threads
```cpp
void HANDLE_CLIENT(int client_socket, int id) {
    // Thread-per-client model
    // Handles all communication for specific client
}
```

**Thread Lifecycle:**
1. **Creation**: `std::thread t(HANDLE_CLIENT, client_socket, u_id)`
2. **Storage**: Stored in `CLIENT_INFO` struct with move semantics
3. **Cleanup**: `detach()` or `join()` depending on disconnect type

#### Thread Synchronization
```cpp
std::mutex client_mtx;  // Protects global clients vector
std::mutex cout_mtx;    // Protects ncurses operations
```

### Client Threading Model

#### Dual-Thread Design
```cpp
std::thread t1(SEND_MESSAGE, CLIENT_SOCKET);  // Input handling
std::thread t2(RECV_MESSAGE, CLIENT_SOCKET);  // Message reception
```

**Send Thread Responsibilities:**
- Captures keyboard input using ncurses `wgetch()`
- Processes special keys (Enter, Backspace)
- Sends messages to server
- Handles exit command `#exit`

**Receive Thread Responsibilities:**
- Continuously listens for incoming messages
- Updates message display window
- Handles server disconnect scenarios

---

## Ncurses User Interface System

### Server UI Components

#### Two-Window Layout
```cpp
WINDOW *log_win = nullptr;     // Server activity log
WINDOW *status_win = nullptr;  // Connected clients status
```

**Log Window Features:**
- Scrollable message history (`scrollok(log_win, TRUE)`)
- Timestamped entries using `strftime()`
- Thread-safe updates with `cout_mtx`

**Status Window Features:**
- Real-time client list display
- Shows client ID and username
- Updates on connect/disconnect events

#### Window Management Functions
```cpp
void setup_ncurses() {
    initscr();           // Initialize ncurses
    cbreak();            // Disable line buffering
    noecho();            // Don't echo input
    keypad(stdscr, TRUE); // Enable special keys
    start_color();       // Enable color support
    curs_set(0);        // Hide cursor
}
```

### Client UI Components

#### Message Display System
```cpp
WINDOW *message_win = nullptr;  // Chat history display
WINDOW *input_win = nullptr;    // Message input area
```

**Message Window:**
- Scrollable chat history
- Automatic line wrapping
- Color-coded user messages

**Input Window:**
- Fixed-height input area (3 lines)
- Real-time character display
- Backspace and cursor management

#### Input Processing Logic
```cpp
void SEND_MESSAGE(int CLIENT_SOCKET) {
    int cursor_x = 6;  // Start after "You: "
    while (true) {
        int ch = wgetch(input_win);
        if (ch == '\n') {
            // Send message
        } else if (ch == KEY_BACKSPACE || ch == 127) {
            // Handle backspace
        } else if (isprint(ch)) {
            // Add printable character
        }
    }
}
```

---

## Cache Implementation with LRU Algorithm

### Cache Class Architecture
```cpp
class Cache {
    std::unordered_map<std::string, Node*> cacheMap;
    Node *head, *tail;  // Doubly-linked list sentinels
    int CAPACITY;
};
```

### Node Structure
```cpp
struct Node {
    std::string key;    // Client ID as string
    std::string value;  // Message content
    Node *prev, *next;  // Doubly-linked list pointers
};
```

### LRU Operations

#### PUT_DATA Implementation
```cpp
void PUT_DATA(const std::string &key, const std::string &value) {
    if (cacheMap.find(key) != cacheMap.end()) {
        // Update existing entry
        Node *exist = cacheMap[key];
        cacheMap.erase(key);
        Del_Node(exist);
    }
    
    if (cacheMap.size() == CAPACITY) {
        // Remove LRU (tail->prev)
        cacheMap.erase(tail->prev->key);
        Del_Node(tail->prev);
    }
    
    // Add new node at head
    ADD_Node(new Node(key, value));
    cacheMap[key] = head->next;
}
```

#### Time Complexity Analysis
- **GET Operation**: O(1) via hash map lookup
- **PUT Operation**: O(1) via hash map + doubly-linked list
- **Memory Usage**: O(capacity) with maximum 5 messages stored

---

## Client-Server Communication Protocol

### Message Structure
```cpp
struct MessageFormat {
    char name[MAX_LEN];     // Sender username
    int color_id;           // For client-side color coding
    char message[MAX_LEN];  // Message content
};
```

### Protocol Flow

#### Normal Message Broadcasting
1. **Client Sends**: Message content only
2. **Server Receives**: Associates with client ID and username
3. **Server Broadcasts**: `name + color_id + message` to all except sender
4. **Cache Storage**: Stores message for history retrieval

#### Connection Handshake
```cpp
// Client side
send(CLIENT_SOCKET, name, sizeof(name), 0);

// Server side  
recv(client_socket, name, sizeof(name), 0);
SET_NAME(id, name);
```

#### Color Assignment System
```cpp
void BROADCAST_ID_FOR_COLOR(int num, int SENDER_ID) {
    for (int i = 0; i < clients.size(); ++i) {
        if (clients[i].id != SENDER_ID) {
            send(clients[i].socket, &num, sizeof(num), 0);
        }
    }
}
```
- Each client gets unique color based on ID
- Color information sent separately from message
- Prevents sender from receiving own messages

---

## Command System

### Server Command Processing

#### Exit Command (`#exit`)
```cpp
if (strcmp(msg, "#exit") == 0) {
    std::string bye = std::string(name) + " has left";
    add_log_message(bye);
    BROADCASTING("NEW_CON", id);
    BROADCASTING(bye, id);
    END_CON(id);
    return;
}
```

#### Get Clients Command (`#gc`)
```cpp
if (strcmp(msg, "#gc") == 0) {
    uint16_t COUNT = GET_CLIENT_COUNT();
    std::string INFO = GetClientsInfo();
    // Send client information back to requester
}
```

#### Private Chat Initiation (`#cli`)
```cpp
if (strcmp(msg, "#cli") == 0) {
    char target[MAX_LEN];
    recv(client_socket, target, sizeof(target), 0);
    // Find target client and establish private channel
}
```

#### Message History Retrieval (`#getmsg`)
```cpp
if (strcmp(msg, "#getmsg") == 0) {
    std::string INFO_MSG = Get_old_message();
    // Send cached messages to requester
}
```

### Client Command Recognition
- Commands processed locally before server transmission
- `#exit` triggers graceful shutdown sequence
- Other commands forwarded to server for processing

---

## Error Handling and Resource Management

### Signal Handling
```cpp
void CATCH_CTRL_C(int signal) {
    char terminate[MAX_LEN] = "#exit";
    send(CLIENT_SOCKET, terminate, sizeof(terminate), 0);
    EXIT_FLAG = true;
    cleanup_ncurses();
    exit(signal);
}
```

### Socket Error Management
```cpp
int bytes_recv = recv(client_socket, msg, sizeof(msg), 0);
if (bytes_recv <= 0) {
    // Client disconnected unexpectedly
    return;  // Exit thread gracefully
}
```

### Resource Cleanup Patterns

#### Ncurses Cleanup
```cpp
void cleanup_ncurses() {
    if (message_win) delwin(message_win);
    if (input_win) delwin(input_win);
    endwin();
}
```

#### Thread Cleanup
```cpp
void END_CON(int ID) {
    clients[i].th.detach();  // Detach thread
    clients.erase(clients.begin() + i);  // Remove from vector
}
```

---

## Memory Management and Thread Safety

### RAII Principles
- **Socket Management**: Automatic closure on destructor/signal
- **Ncurses Resources**: Explicit cleanup in destructors
- **Thread Lifetimes**: Proper join/detach based on exit type

### Thread-Safe Operations
```cpp
std::lock_guard<std::mutex> guard(client_mtx);
// Critical section accessing shared clients vector
clients.push_back({u_id, random, client_socket, std::move(t)});
```

### Move Semantics Usage
```cpp
clients.push_back({u_id, random, client_socket, std::move(t)});
```
- Efficient transfer of `std::thread` objects
- Prevents accidental copying of non-copyable resources

### Memory Layout Considerations
- **Stack Allocation**: Local variables in thread functions
- **Heap Allocation**: Dynamic `Node` objects in cache
- **Static Storage**: Global mutexes and client vector

---

## Compilation and Linking Requirements

### Required Libraries
```bash
g++ -o server server.cpp sockutil.cpp -lncurses -lpthread
g++ -o client client.cpp sockutil.cpp -lncurses -lpthread
```

### Library Dependencies
- **ncurses**: Terminal UI manipulation
- **pthread**: POSIX threading support (implicit in C++11 std::thread)
- **socket**: Berkeley sockets API (part of libc)

### Compiler Requirements
- **C++11 or later**: For `std::thread`, `std::mutex`, move semantics
- **POSIX compatibility**: For socket programming and signal handling

---

## Performance Characteristics

### Scalability Analysis
- **Concurrent Clients**: Limited by thread overhead and file descriptor limits
- **Memory Usage**: O(n) where n = number of connected clients
- **Message Throughput**: Bounded by network latency and mutex contention

### Optimization Opportunities
1. **Thread Pool**: Replace thread-per-client with worker thread pool
2. **Async I/O**: Use epoll/kqueue for better scalability
3. **Memory Pool**: Pre-allocate message buffers
4. **Lock-Free Structures**: Reduce mutex contention in hot paths

This comprehensive documentation covers every major aspect of the C++ Terminal Chat Server implementation, ensuring complete understanding of the sophisticated multi-threaded networking architecture. 
