Provable fairness
------------------
Steps
1. Client: Request random seed from server
2. Server: Generate random seed (SS) and provide hash (SSH) to client
3. Client: Create random seed (CS) and send it to server
4. Server: Combine client seed with server seed and hash result (CSH)
5. Server: Determine game outcome O from CSH and adjust internal values accordingly
6. Server: Send O and SS to client
7. Client: Verify SS hashes to SSH
8. Client: Calculate CSH from SS and CS
9. Client: Verify CSH yields same outcome as O

Subsequent rounds

Go back to step 1