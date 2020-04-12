/*
32-bit Hash function based on lookup2 by Bob Jenkins:
http://burtleburtle.net/bob/c/lookup2.c
lookup2.c, by Bob Jenkins, December 1996, Public Domain.
*/
var JenkinsLookup2 = (function() {

    function mix(a, b, c) {
        /*
        --------------------------------------------------------------------
        mix -- mix 3 32-bit values reversibly.
        For every delta with one or two bit set, and the deltas of all three
          high bits or all three low bits, whether the original value of a,b,c
          is almost all zero or is uniformly distributed,
        * If mix() is run forward or backward, at least 32 bits in a,b,c
          have at least 1/4 probability of changing.
        * If mix() is run forward, every bit of c will change between 1/3 and
          2/3 of the time.  (Well, 22/100 and 78/100 for some 2-bit deltas.)
        mix() was built out of 36 single-cycle latency instructions in a 
          structure that could supported 2x parallelism, like so:
              a -= b; 
              a -= c; x = (c>>13);
              b -= c; a ^= x;
              b -= a; x = (a<<8);
              c -= a; b ^= x;
              c -= b; x = (b>>13);
              ...
          Unfortunately, superscalar Pentiums and Sparcs can't take advantage 
          of that parallelism.  They've also turned some of those single-cycle
          latency instructions into multi-cycle latency instructions.  Still,
          this is the fastest good hash I could find.  There were about 2^^68
          to choose from.  I only looked at a billion or so.
        --------------------------------------------------------------------
        */
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        
        a -= b; a -= c; a ^= (c>>>13); a >>>= 0;
        b -= c; b -= a; b ^= (a<<8); b >>>= 0;
        c -= a; c -= b; c ^= (b>>>13); c >>>= 0;
        
        a -= b; a -= c; a ^= (c>>>12); a >>>= 0;
        b -= c; b -= a; b ^= (a<<16); b >>>= 0;
        c -= a; c -= b; c ^= (b>>>5); c >>>= 0;
        
        a -= b; a -= c; a ^= (c>>>3); a >>>= 0;
        b -= c; b -= a; b ^= (a<<10); b >>>= 0;
        c -= a; c -= b; c ^= (b>>>15); c >>>= 0;

        return [a, b, c];
    }

    function hash(data, initval) {
        /*
        --------------------------------------------------------------------
        hash() -- hash a variable-length key into a 32-bit value
          k     : the key (the unaligned variable-length array of bytes)
          len   : the length of the key, counting by bytes
          level : can be any 4-byte value
        Returns a 32-bit value.  Every bit of the key affects every bit of
        the return value.  Every 1-bit and 2-bit delta achieves avalanche.
        About 36+6len instructions.

        The best hash table sizes are powers of 2.  There is no need to do
        mod a prime (mod is sooo slow!).  If you need less than 32 bits,
        use a bitmask.  For example, if you need only 10 bits, do
          h = (h & hashmask(10));
        In which case, the hash table should have hashsize(10) elements.

        If you are hashing n strings (ub1 **)k, do it like this:
          for (i=0, h=0; i<n; ++i) h = hash( k[i], len[i], h);

        By Bob Jenkins, 1996.  bob_jenkins@burtleburtle.net.  You may use this
        code any way you wish, private, educational, or commercial.  It's free.

        See http://burtleburtle.net/bob/hash/evahash.html
        Use for hash table lookup, or anything where one collision in 2^32 is
        acceptable.  Do NOT use for cryptographic purposes.
        --------------------------------------------------------------------
        */
        initval = initval || 0;
        var lenpos = data.length;
        var length = lenpos;
        
        var a, b, c, p, q;

        function ord(chr) {
            return chr.charCodeAt(0);
        }
        
        if (length === 0) {
            return 0;
        }

        // Set up the internal state
        a = b = 0x9e3779b9; // the golden ratio; an arbitrary value
        c = initval;        // the previous hash value
        p = 0;

        // ---------------------------------------- handle most of the key
        while (lenpos >= 12) {
            a += (ord(data[p+0]) + (ord(data[p+1])<<8) + (ord(data[p+2])<<16) + (ord(data[p+3])<<24));
            b += (ord(data[p+4]) + (ord(data[p+5])<<8) + (ord(data[p+6])<<16) + (ord(data[p+7])<<24));
            c += (ord(data[p+8]) + (ord(data[p+9])<<8) + (ord(data[p+10])<<16) + (ord(data[p+11])<<24));
            q = mix(a, b, c);
            a = q[0], b = q[1], c = q[2];
            p += 12;
            lenpos -= 12;
        }
        
        // ------------------------- handle the last 11 bytes
        c += length;
        if (lenpos >= 11) c += ord(data[p+10])<<24;
        if (lenpos >= 10) c += ord(data[p+9])<<16;
        if (lenpos >= 9)  c += ord(data[p+8])<<8;
        // the first byte of c is reserved for the length
        if (lenpos >= 8)  b += ord(data[p+7])<<24;
        if (lenpos >= 7)  b += ord(data[p+6])<<16;
        if (lenpos >= 6)  b += ord(data[p+5])<<8;
        if (lenpos >= 5)  b += ord(data[p+4]);
        if (lenpos >= 4)  a += ord(data[p+3])<<24;
        if (lenpos >= 3)  a += ord(data[p+2])<<16;
        if (lenpos >= 2)  a += ord(data[p+1])<<8;
        if (lenpos >= 1)  a += ord(data[p+0]);
        q = mix(a, b, c);
        a = q[0], b = q[1], c = q[2];

        // ------------------------- report the result
        return c >>> 0;
    }

    return hash;

})();


/* Jenkins one-at-a-time hash */
function JenkinsOAAT(key) {
    var hash = 0;
    for (var i = 0; i < key.length; ++i) {
        hash += key.charCodeAt(i);
        hash += (hash << 10);
        hash ^= (hash >>> 6);
    }
    hash += (hash << 3);
    hash ^= (hash >>> 11);
    hash += (hash << 15);
    return (hash >>> 0);
}

module.exports = {
    lookup2: JenkinsLookup2,
    oaat: JenkinsOAAT
};