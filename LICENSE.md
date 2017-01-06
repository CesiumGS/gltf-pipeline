Copyright 2015-2016 Richard Lee, Analytical Graphics, Inc., and Contributors

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Third-Party Code
================

gltf-pipeline includes the following third-party code.

### astc-encoder

https://github.com/ARM-software/astc-encoder

> END USER LICENCE AGREEMENT FOR THE MALI ASTC SPECIFICATION AND SOFTWARE CODEC,
> VERSION: 1.3
>
> THIS END USER LICENCE AGREEMENT ("LICENCE") IS A LEGAL AGREEMENT BETWEEN YOU
> (EITHER A SINGLE INDIVIDUAL, OR SINGLE LEGAL ENTITY) AND ARM LIMITED ("ARM")
> FOR THE USE OF THE SOFTWARE ACCOMPANYING THIS LICENCE. ARM IS ONLY WILLING
> TO LICENSE THE SOFTWARE TO YOU ON CONDITION THAT YOU ACCEPT ALL OF THE TERMS
> IN THIS LICENCE. BY CLICKING "I AGREE" OR BY INSTALLING OR OTHERWISE USING
> OR COPYING THE SOFTWARE YOU INDICATE THAT YOU AGREE TO BE BOUND BY ALL THE
> TERMS OF THIS LICENCE.
>
> IF YOU DO NOT AGREE TO THE TERMS OF THIS LICENCE, ARM IS UNWILLING TO LICENSE
> THE SOFTWARE TO YOU AND YOU MAY NOT INSTALL, USE OR COPY THE SOFTWARE.
>
> 1.  DEFINITIONS.
>
> "Authorised Purpose" means the use of the Software solely to develop products
> and tools which implement the Khronos ASTC specification to;
> (i) compress texture images into ASTC format ("Compression Results");
> (ii) distribute such Compression Results to third parties; and
> (iii) decompress texture images stored in ASTC format.
>
> "Software" means the source code and Software binaries accompanying this
> Licence, and any printed, electronic or online documentation supplied with it,
> in all cases relating to the MALI ASTC SPECIFICATION AND SOFTWARE CODEC.
>
> 2. LICENCE GRANT.
>
> ARM hereby grants to you, subject to the terms and conditions of this Licence,
> a nonexclusive, nontransferable, free of charge, royalty free, worldwide
> licence to use, copy, modify and (subject to Clause 3 below) distribute the
> Software solely for the Authorised Purpose.
>
> No right is granted to use the Software to develop hardware.
>
> Notwithstanding the foregoing, nothing in this Licence prevents you from
> using the Software to develop products that conform to an application
> programming interface specification issued by The Khronos Group Inc.
> ("Khronos"), provided that you have licences to develop such products
> under the relevant Khronos agreements.
>
>  3. RESTRICTIONS ON USE OF THE SOFTWARE.
>
> RESTRICTIONS ON TRANSFER OF LICENSED RIGHTS: The rights granted to you under
> this Licence may not be assigned by you to any third party without the prior
> written consent of ARM.
>
> TITLE AND RESERVATION OF RIGHTS: You acquire no rights to the Software other
> than as expressly provided by this Licence. The Software is licensed not sold.
> ARM does not transfer title to the Software to you. In no event shall the
> licences granted in Clause 2 be construed as granting you expressly or by
> implication, estoppel or otherwise, licences to any ARM technology other than
> the Software.
>
> NOTICES: You shall not remove from the Software any copyright notice or other
> notice (whether ARM's or its licensor's), and you shall ensure that any such
> notice is reproduced in any copies of the whole or any part of the Software
> made by you.  You shall not use ARM's or its licensor's name, logo or
> trademarks to market Compression Results. If you distribute the Software to a
> third party, you agree to include a copy of this Licence with such
> distribution.
>
> 4. NO SUPPORT.
>
> ARM has no obligation to support or to continue providing or updating any of
> the Software.
>
> 5. NO WARRANTIES.
>
> YOU AGREE THAT THE SOFTWARE IS LICENSED "AS IS", AND THAT ARM EXPRESSLY
> DISCLAIMS ALL REPRESENTATIONS, WARRANTIES, CONDITIONS OR OTHER TERMS, EXPRESS,
> IMPLIED OR STATUTORY, TO THE FULLEST EXTENT PERMITTED BY LAW. YOU EXPRESSLY
> ASSUME ALL LIABILITIES AND RISKS, FOR USE OR OPERATION OF ANY APPLICATION
> PROGRAMS YOU CREATE WITH THE SOFTWARE, AND YOU ASSUME THE ENTIRE COST OF ALL
> NECESSARY SERVICING, REPAIR OR CORRECTION.
>
> 6. LIMITATION OF LIABILITY.
>
> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ARM BE
> LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES
> (INCLUDING LOSS OF PROFITS) ARISING OUT OF THE USE OR INABILITY TO USE THE
> SOFTWARE WHETHER BASED ON A CLAIM UNDER CONTRACT, TORT OR OTHER LEGAL THEORY,
> EVEN IF ARM WAS ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
>
> ARM does not seek to limit or exclude liability for death or personal injury
> arising from ARM's negligence and because some jurisdictions do not permit the
> exclusion or limitation of liability for consequential or incidental damages
> the above limitation relating to liability for consequential damages may not
> apply to you.
>
> NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED IN THIS LICENCE, THE
> MAXIMUM LIABILITY OF ARM TO YOU IN AGGREGATE FOR ALL CLAIMS MADE AGAINST ARM
> IN CONTRACT TORT OR OTHERWISE UNDER OR IN CONNECTION WITH THE SUBJECT MATTER
> OF THIS LICENCE SHALL NOT EXCEED THE GREATER OF THE TOTAL OF SUMS PAID BY YOU
> TO ARM (IF ANY) FOR THIS LICENCE AND US$5.00.
>
> 7. U.S. GOVERNMENT END USERS.
>
> US Government Restrictions: Use, duplication, reproduction, release,
> modification, disclosure or transfer of this commercial product and
> accompanying documentation is restricted in accordance with the terms
> of this Licence.
>
> 8. TERM AND TERMINATION.
>
> This Licence shall remain in force until terminated by you or by ARM. Without
> prejudice to any of its other rights if you are in breach of any of the terms
> and conditions of this Licence then ARM may terminate this Licence immediately
> upon giving written notice to you. You may terminate this Licence at any time.
>
> Upon termination of this Licence by you or by ARM you shall stop using the
> Software and destroy all copies of the Software in your possession together
> with all documentation and related materials. The provisions of Clauses 1, 3,
> 4, 5, 6, 7, 8 and 9  shall survive termination of this Licence.
>
> 9. GENERAL.
>
> This Licence is governed by English Law. Except where ARM agrees otherwise in
> a written contract signed by you and ARM, this is the only agreement between
> you and ARM relating to the Software and it may only be modified by written
> agreement between you and ARM. Except as expressly agreed in writing, this
> Licence may not be modified by purchase orders, advertising or other
> representation by any person. If any clause in this Licence is held by a court
> of law to be illegal or unenforceable the remaining provisions of this Licence
> shall not be affected thereby. The failure by ARM to enforce any of the
> provisions of this Licence, unless waived in writing, shall not constitute a
> waiver of ARM's rights to enforce such provision or any other provision of
> this Licence in the future.
>
> You agree to comply fully with all laws and regulations of the United States
> and other countries ("Export Laws") to assure that the Software is not;
> (1) exported, directly or indirectly, in violation of Export Laws, either to
> any countries that are subject to U.S.A. export restrictions or to any end
> user who has been prohibited from participating in the U.S.A. export
> transactions by any federal agency of the U.S.A. government; or
> (2) intended to be used for any purpose prohibited by Export Laws, including,
> without limitation, nuclear, chemical, or biological weapons proliferation.>

### async

https://www.npmjs.com/package/async

> Copyright (c) 2010-2016 Caolan McMahon
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

### bluebird

https://www.npmjs.com/package/bluebird

> The MIT License (MIT)
>
> Copyright (c) 2013-2015 Petka Antonov
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

### buffer-equal

https://www.npmjs.com/package/buffer-equal

> This software is released under the MIT license:
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### Cesium

http://cesiumjs.org/

> Copyright 2011-2016 Cesium Contributors
>
> Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
>
> http://www.apache.org/licenses/LICENSE-2.0
>
> Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

See https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

### clone

https://www.npmjs.com/package/clone

> Copyright © 2011-2015 Paul Vorbach <paul@vorba.ch>
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the “Software”), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### crunch

https://github.com/BinomialLLC/crunch

> crunch/crnlib uses the ZLIB license:
> http://opensource.org/licenses/Zlib
>
> Copyright (c) 2010-2016 Richard Geldreich, Jr. and Binomial LLC
>
> This software is provided 'as-is', without any express or implied
warranty.  In no event will the authors be held liable for any damages
arising from the use of this software.
>
> Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:
>
> 1. The origin of this software must not be misrepresented; you must not
claim that you wrote the original software. If you use this software
in a product, an acknowledgment in the product documentation would be
appreciated but is not required.
>
> 2. Altered source versions must be plainly marked as such, and must not be
misrepresented as being the original software.
>
> 3. This notice may not be removed or altered from any source distribution.

### data-uri-to-buffer

https://www.npmjs.com/package/data-uri-to-buffer

> The MIT License
>
> Copyright (c) 2014 Nathan Rajlich <nathan@tootallnate.net>
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### deep-equal

https://www.npmjs.com/package/deep-equal

> This software is released under the MIT license:
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of
> this software and associated documentation files (the "Software"), to deal in
> the Software without restriction, including without limitation the rights to
> use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
> the Software, and to permit persons to whom the Software is furnished to do so,
> subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
> FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
> COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
> IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
> CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### etc2comp

https://github.com/google/etc2comp

> Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
>
> http://www.apache.org/licenses/LICENSE-2.0
>
> Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

### fs-extra

https://www.npmjs.com/package/fs-extra

> (The MIT License)
>
> Copyright (c) 2011-2016 JP Richardson
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
(the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify,
> merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
> WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
> OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
> ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### image-size

https://www.npmjs.com/package/image-size

> The MIT License (MIT)
>
> Copyright © 2014 Aditya Yadav, http://netroy.in
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### jimp

https://www.npmjs.com/package/jimp

Pipelines configured for image processing use `jimp` to edit textures.

> The MIT License (MIT)
>
> Copyright (c) 2014 Oliver Moran
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### jsonpath

https://www.npmjs.com/package/JSONPath

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### mime

https://www.npmjs.com/package/mime

> Copyright (c) 2010 Benjamin Thomas, Robert Kieffer
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

### PVRTexTool

https://community.imgtec.com/developers/powervr/tools/pvrtextool/

License: https://community.imgtec.com/developers/powervr/powervr-tools-software-eula/

### uuid

https://www.npmjs.com/package/uuid

> The MIT License (MIT)
>
> Copyright (c) 2010-2016 Robert Kieffer and other contributors
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### yargs

https://www.npmjs.com/package/yargs

The command-line tool uses yargs.

> Copyright 2010 James Halliday (mail@substack.net)
Modified work Copyright 2014 Contributors (ben@npmjs.com)
>
> This project is free software released under the MIT/X11 license:
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

### tribox3

`triangleAxisAlignedBoundingBoxOverlap` is a port of Tomas Akenine-Möller's public domain triangle-box overlap test. Original code can be found [here](http://fileadmin.cs.lth.se/cs/Personal/Tomas_Akenine-Moller/code/).

