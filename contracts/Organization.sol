pragma solidity ^0.4.6;

/*
    Copyright 2016, Jordi Baylina

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


import "Owned.sol";
import "DelegateStatus.sol";

contract VoteAggregatorInterface {

    function isValid(bytes _vote) constant returns(bool);
    function deltaVote(int _amount, bytes32 _ballot) returns (bool _succes);

}


contract OrganizationInterface {

    function addPoll(
        string _description,
        uint _closeDelegateTime,
        uint _closeTime,
        uint _categoryId,
        address _agregatorAddr) returns (uint _idPoll);

      function addVoter(address _voter, uint _amount);
      function removeVoter(address _voter, uint _amount);

      function addDelegate(string name) returns(uint _idDelegate);
      function removeDelegate(uint _idDelegate);

      function addCategory(bytes32 _idCategory, string _description, address _parentCategory);
      function removeCategory(uint _idCategory);

      function vote(uint _idPoll, bytes32[] _ballots, uint[] _amounts);
      function unvote(uint _idPoll);
      function pollDelegate(uint _idPoll, address _delegate);
      function updateDelegates(uint[] _categoryIds, uint[] _delegates);

      function delegateVote(uint _idDelegate, uint _idPoll, bytes32[] _ballots, uint[] _amounts, string motivation);
      function delegateUpdateDelegates(uint _idDelegate, uint[] _categoryIds, uint[] _delegates);

}


contract Organization is OrganizationInterface, Owned {

    uint constant  MIN_TIME_FINAL_VOTING = 86400;
    uint constant  DELEGATE_MODIFICATION_TIME = 3600*4;


    struct Category {
        string description;
        bool deleted;
        DelegateStatus delegateStatus;
        uint[] activePolls;
    }

    Category[] public categories;

    struct Vote {
        uint time;
        bytes32[] ballots;
        uint[] amounts;
        string motivation;
        uint total;
    }

    struct Poll {

        string description;

        uint closeDelegateTime;
        uint closeTime;

        uint idCategory;

        VoteAggregatorInterface agregator;
        DelegateStatus delegateStatus;

        mapping(address => Vote) votes;
    }

    Poll[] public polls;

    struct Delegate {
        string name;
        address owner;
        bool removed;
    }

    Delegate[] public delegates;

    mapping(address => uint) public balanceOf;

    DelegateStatusFactory delegateStatusFactory;

    function Organization(address _delegateStatusFactory) {
        delegateStatusFactory = DelegateStatusFactory(_delegateStatusFactory);
    }


    function addPoll(
        string _description,
        uint _closeDelegateTime,
        uint _closeTime,
        uint _categoryId,
        address _agregatorAddr) onlyOwner returns (uint _idPoll)
    {
        var c = categories[_categoryId];
        if (address(c.delegateStatus) == 0) throw; // Invalid category
        if (now + MIN_TIME_FINAL_VOTING > _closeTime) throw;
        if (_closeTime < _closeDelegateTime + MIN_TIME_FINAL_VOTING) throw;

        Poll p = polls[polls.length++];
        p.description = _description;
        p.closeDelegateTime = _closeDelegateTime;
        p.closeTime = _closeTime;
        p.idCategory = _categoryId;
        p.agregator = VoteAggregatorInterface(_agregatorAddr);
        p.delegateStatus = delegateStatusFactory.createDelegateStatus(c.delegateStatus);

        c.activePolls.push(polls.length-1);
    }


    function vote(uint _idPoll, bytes32[] _ballots, uint[] _amounts) {
        var p = getPoll(_idPoll);

        if (!doVote(p, msg.sender, _ballots, _amounts, "")) throw;
    }

    function delegateVote(uint _idDelegate, uint _idPoll, bytes32[] _ballots, uint[] _amounts, string _motivation) {
        Delegate d = getDelegate(_idDelegate);
        if (d.owner != msg.sender) throw;

        address voter = address(_idDelegate);

        var p = getPoll(_idPoll);

        if (!doVote(p, address(_idDelegate), _ballots, _amounts, _motivation)) throw;
    }

    function doVote(Poll storage _poll, address _voter, bytes32[] _ballots, uint[] _amounts, string _motivation) internal returns (bool _succes) {

        if (!canVote(_poll, _voter)) return false;

        var amount = _poll.delegateStatus.getVotingPower(_voter);

        address delegate = _poll.delegateStatus.getDelegate(_voter);

        if (delegate != 0) {
            var finalDelegate = _poll.delegateStatus.getFinalDelegate(_voter);

            if ((finalDelegate != 0) && (hasVoted(_poll,finalDelegate))) {
                deltaVote(_poll, finalDelegate, -int(amount));
            }

            _poll.delegateStatus.undelegate(_voter);
        }

        setVote(_poll, _voter, _ballots, _amounts, amount, _motivation);
        return true;
    }

    function unvote(uint _idPoll) {
        var p = getPoll(_idPoll);

        if (!doUnvote(p, msg.sender)) throw;
    }

    // Will allways throw.
    function delegateUnvote(uint _idDelegate, uint _idPoll) {
        Delegate d = getDelegate(_idDelegate);
        if (d.owner != msg.sender) throw;

        address voter = address(_idDelegate);

        var p = getPoll(_idPoll);

        if (!doUnvote(p, voter)) throw;
    }

    function doUnvote(Poll storage _poll, address _voter) internal returns (bool _success)  {
        if (!canVote(_poll, _voter)) return false;

        uint amount = _poll.delegateStatus.getVotingPower(_voter);

        if (hasVoted(_poll, _voter)) {
            setVote(_poll, _voter, new bytes32[](0), new uint[](0), amount, "");
        }

        Category c = categories[_poll.idCategory];

        var delegate = c.delegateStatus.getDelegate(_voter);

        if (delegate != 0) {
            _poll.delegateStatus.setDelegate(_voter, delegate);
            address finalDelegate = _poll.delegateStatus.getFinalDelegate(_voter);
            if ((finalDelegate != 0)&&( hasVoted(_poll,finalDelegate))) {
                deltaVote(_poll, finalDelegate, int(amount));
            }
        }
    }

    function pollDelegate(uint _idPoll, address _delegate) {
        Poll p = getPoll(_idPoll);

        if (!doPollDelegate(p, msg.sender, _delegate)) throw;
    }

    function delegatePollDelegate(uint _idDelegate, uint _idPoll, address _delegate) {
        Delegate d = getDelegate(_idDelegate);
        if (d.owner != msg.sender) throw;

        Poll p = getPoll(_idPoll);

        address voter = address(_idDelegate);

        if (!doPollDelegate(p, voter, _delegate)) throw;
    }

    function doPollDelegate(Poll storage _poll, address _voter, address _delegate) internal returns(bool _succes) {

        if (! canVote(_poll, _voter) ) return false;

        doUnvote(_poll, _voter);

        int amount = int(_poll.delegateStatus.getVotingPower(_voter));

        _poll.delegateStatus.setDelegate(_voter, _delegate);
        var finalDelegate = _poll.delegateStatus.getFinalDelegate(_voter);

        if (_poll.votes[finalDelegate].time != 0) {
            deltaVote(_poll, finalDelegate, amount);
        }
    }



    function updateDelegates(uint[] _categoryIds, uint[] _delegates) {
        doUpdateDelegates(msg.sender, _categoryIds, _delegates);
    }

    function delegateUpdateDelegates(uint _idDelegate, uint[] _categoryIds, uint[] _delegates) {
        Delegate d = getDelegate(_idDelegate);
        if (d.owner != msg.sender) throw;

        address voter = address(_idDelegate);

        if (!doUpdateDelegates(voter, _categoryIds, _delegates)) throw;

    }

    function doUpdateDelegates(address _voter, uint[] _categoryIds, uint[] _delegates) returns (bool _success) {
        uint i;
        uint j;
        if (_categoryIds.length != _delegates.length) return false;
        for (i=0; i<_categoryIds.length; i++) {
            Category c = getCategory(_categoryIds[i]);
            address delegate = address(_delegates[i]);
            if (!isDelegate(delegate)) return false;
            c.delegateStatus.setDelegate(_voter,delegate);
            for (j=0; j<c.activePolls.length; j++) {
                Poll p = polls[c.activePolls[i]];
                if (now < p.closeTime ) {
                    if (!hasVoted(p, _voter)) {
                        doPollDelegate(p, _voter, delegate);
                    }
                } else {
                    c.activePolls[i] = c.activePolls[c.activePolls.length-1];
                    c.activePolls.length --;
                    j--;
                }
            }
        }
    }


    function canVote(Poll storage _poll, address _voter) internal returns (bool) {
        if (now >= _poll.closeTime) return false;
        if (isDelegate(_voter)) {
            if (_poll.votes[_voter].time != 0) return false;
            if (now >= _poll.closeDelegateTime) {
                address finalDelegate = _poll.delegateStatus.getFinalDelegate(_voter);
                if (finalDelegate == 0) return false;
                if (_poll.votes[finalDelegate].time == 0 ) return false;
                if (now > _poll.votes[finalDelegate].time + DELEGATE_MODIFICATION_TIME) return false;
            }
        } else {
            if (_poll.delegateStatus.getVotingPower(msg.sender) == 0) return false;
        }

        return true;
    }

    function hasVoted(Poll storage _poll, address _voter) internal returns (bool) {
        return _poll.votes[_voter].time > 0;
    }





    function setVote(Poll storage p, address _voter, bytes32[] _ballots, uint[] _amounts, uint _amount, string _motivation) internal {
        uint i;
        int a;
        uint total;

        Vote v = p.votes[msg.sender];

        total = 0;
        for (i=0; i<v.ballots.length; i++) {
            total += v.amounts[i];
        }

        for (i=0; i< v.ballots.length; i++) {
            a = int(v.total * v.amounts[i] / total);
            p.agregator.deltaVote(-a, v.ballots[i]);
            v.amounts[i] =0;
            v.ballots[i] =0;
        }

        v.ballots.length=0;
        v.amounts.length=0;
        v.total = 0;
        v.time = 0;
        v.motivation = "";

        total = 0;
        for (i=0; i<_ballots.length; i++) {
            total += _amounts[i];
        }
        if (total == 0) return;
        v.time = now;
        v.motivation = _motivation;
        for (i=0; i< _ballots.length; i++) {
            v.ballots.push(_ballots[i]);
            v.amounts.push(_amounts[i]);
            a = int(_amounts[i] * _amount / total);
            p.agregator.deltaVote(a, _ballots[i]);
        }
        v.total = _amount;
    }

    function deltaVote(Poll storage p, address _voter, int _amount) internal {
        uint i;
        Vote v = p.votes[msg.sender];
        uint total = 0;
        if (_amount == 0) return;
        for (i=0; i<v.ballots.length; i++) {
            total += v.amounts[i];
        }
        if (total == 0) return;
        for (i=0; i< v.ballots.length; i++) {
            int a = int(v.amounts[i]) * _amount / int(total);
            p.agregator.deltaVote(a, v.ballots[i]);
        }
        v.total += uint(_amount);
    }

    function getPoll(uint _idPoll) internal returns (Poll storage p) {
        if (_idPoll >= polls.length) throw;
        p = polls[_idPoll];
    }

    function getCategory(uint _idCategory) internal returns (Category storage c) {
        if (_idCategory >= categories.length) throw;
        c = categories[_idCategory];
    }

    function getDelegate(uint _idDelegate) internal returns (Delegate storage d) {
        if (_idDelegate >= delegates.length) throw;
        d = delegates[_idDelegate];
    }

    function addVoter(address _voter, uint _amount) onlyOwner {
        uint i;
        uint j;
        address delegate;

        balanceOf[_voter] += _amount;
        for (i=0; i<categories.length; i++) {
            var c = categories[i];
            delegate = c.delegateStatus.getDelegate(_voter);
            if (delegate!=0) {
                p.delegateStatus.setDelegate(_voter, delegate);
            }
            for (j=0; j<c.activePolls.length; j++) {
                Poll p = polls[c.activePolls[i]];
                if (now < p.closeTime ) {
                    if (p.votes[_voter].time != 0) {
                        deltaVote(p, _voter, int(_amount));
                    } else {
                        delegate = p.delegateStatus.getDelegate(_voter);
                        if (delegate!=0) {
                            p.delegateStatus.setDelegate(_voter, delegate);
                        }
                    }
                } else {
                    c.activePolls[i] = c.activePolls[c.activePolls.length-1];
                    c.activePolls.length --;
                    j--;
                }
            }
        }
    }

    function removeVoter(address _voter, uint _amount) onlyOwner {
        uint i;
        uint j;
        address delegate;

        if (_amount > balanceOf[_voter]) throw;
        balanceOf[_voter] -= _amount;
        for (i=0; i<categories.length; i++) {
            var c = categories[i];
            delegate = c.delegateStatus.getDelegate(_voter);
            if (delegate!=0) {
                p.delegateStatus.setDelegate(_voter, delegate);
            }
            for (j=0; j<c.activePolls.length; j++) {
                Poll p = polls[c.activePolls[i]];
                if (now < p.closeTime ) {
                    if (p.votes[_voter].time != 0) {
                        deltaVote(p, _voter, -int(_amount));
                    } else {
                        delegate = p.delegateStatus.getDelegate(_voter);
                        if (delegate!=0) {
                            p.delegateStatus.setDelegate(_voter, delegate);
                        }
                    }
                } else {
                    c.activePolls[i] = c.activePolls[c.activePolls.length-1];
                    c.activePolls.length --;
                    j--;
                }
            }
        }
    }

    function addDelegate(string _name) onlyOwner returns(uint _idDelegate) {
        Delegate d = delegates[delegates.length++];
        d.name = _name;
        d.owner = msg.sender;
        return delegates.length -1;
    }

    function removeDelegate(uint _idDelegate) onlyOwner{
        Delegate d = getDelegate(_idDelegate);
        if (d.owner != msg.sender) throw;
        d.removed = true;
    }

    function addCategory(bytes32 _idCategory, string _description, address _parentCategory) onlyOwner {
        Category c = categories[categories.length++];
        c.description = _description;
        c.delegateStatus = delegateStatusFactory.createDelegateStatus(_parentCategory);
    }

    function removeCategory(uint _idCategory) onlyOwner {
        Category c = getCategory(_idCategory);
        c.deleted = true;
    }

    function isDelegate(address _voter) internal returns(bool) {
        return (uint(_voter) < 0x1000000);
    }

}


contract DelegateStatusFactory {
    function createDelegateStatus(address _parentStatus) returns (DelegateStatus) {
        return new DelegateStatus(_parentStatus, msg.sender);
    }
}
